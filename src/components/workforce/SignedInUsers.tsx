import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface WorkforceUser {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  user_id: string;
}

const SignedInUsers = () => {
  const { user, hasRole, loading } = useAuth();
  const isAdmin = hasRole("admin");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["workforce-users"],
    queryFn: async (): Promise<WorkforceUser[]> => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, avatar_url, user_id")
        .order("full_name");

      if (error) {
        throw error;
      }

      return profiles || [];
    },
    enabled: isAdmin,
  });

  if (!loading && !isAdmin) {
    return (
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Signed-in users</h2>
            <p className="text-sm text-muted-foreground">
              This view is restricted to administrators.
            </p>
          </div>
        </div>
        <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
          Ask an admin to review active sessions for your workspace.
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Signed-in users</h2>
          <p className="text-sm text-muted-foreground">
            Monitor who is currently authenticated in your Otno Access workspace.
          </p>
        </div>
        <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {isLoading ? "Loading" : `${data?.length || 0} active`}
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`loading-${index}`}
                className="h-32 animate-pulse rounded-xl border border-border bg-muted/50"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
            We could not load signed-in users right now. Please refresh the page.
          </div>
        ) : data && data.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.map((member) => {
              const fullName = member.full_name?.trim() || "Unknown";
              const initials = fullName
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              const isCurrentUser = member.user_id === user?.id;

              return (
                <div
                  key={member.id}
                  className="flex flex-col gap-4 rounded-xl border border-border bg-background p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {initials || <User className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{fullName}</p>
                        {isCurrentUser ? (
                          <span className="rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                            You
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">Signed in</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{member.email || "No email on file"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{member.phone || "No phone on file"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
            No signed-in users were found. Invite teammates to start tracking workforce activity.
          </div>
        )}
      </div>
    </section>
  );
};

export default SignedInUsers;
