import { Mail, Phone, TicketCheck, TicketPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";

type SupportTicket = {
  id: string;
  userId: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
};

const STORAGE_KEY = "supportTickets";

const loadTickets = (): SupportTicket[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as SupportTicket[]) : [];
  } catch (error) {
    console.error("Unable to load support tickets", error);
    return [];
  }
};

const saveTickets = (tickets: SupportTicket[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
};

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<SupportTicket["priority"]>("medium");

  useEffect(() => {
    setTickets(loadTickets());
  }, []);

  const userTickets = useMemo(() => {
    if (!user) return [];
    return tickets
      .filter((ticket) => ticket.userId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [tickets, user]);

  const handleCreateTicket = (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    if (!title.trim() || !description.trim()) return;

    const nextTicket: SupportTicket = {
      id: crypto.randomUUID(),
      userId: user.id,
      title: title.trim(),
      description: description.trim(),
      priority,
      status: "open",
      createdAt: new Date().toISOString(),
    };

    const updatedTickets = [nextTicket, ...tickets];
    setTickets(updatedTickets);
    saveTickets(updatedTickets);
    setTitle("");
    setDescription("");
    setPriority("medium");
  };

  const handleResolveTicket = (ticketId: string) => {
    const updatedTickets = tickets.map((ticket) =>
      ticket.id === ticketId ? { ...ticket, status: "resolved" as const } : ticket,
    );
    setTickets(updatedTickets);
    saveTickets(updatedTickets);
  };

  const handleSidebarItemClick = (item: string) => {
    if (item === "dashboard") {
      navigate("/", { state: { activeItem: "dashboard" }, replace: true });
      return;
    }
    if (item === "inventory" || item === "workforce") {
      navigate("/", { state: { activeItem: item }, replace: true });
      return;
    }
    if (item === "sites") {
      navigate("/sites");
      return;
    }
    if (item === "revenue") {
      navigate("/revenue");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeItem="settings" onItemClick={handleSidebarItemClick} />

      <main className="ml-0 md:ml-64">
        <Header title="Settings" subtitle="Manage support contacts and help resources." />

        <div className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/20 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Track your issues after login</p>
                <p>
                  Submit a ticket below and we will keep it visible in your settings page whenever you sign in.
                </p>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ticket-title">Issue title</Label>
                  <Input
                    id="ticket-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="e.g., Missing scaffold items on site"
                    disabled={!user}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ticket-description">Describe the issue</Label>
                  <Textarea
                    id="ticket-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Provide as many details as possible."
                    disabled={!user}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ticket-priority">Priority</Label>
                  <div className="flex flex-wrap gap-2">
                    {(["low", "medium", "high"] as const).map((level) => (
                      <Button
                        key={level}
                        type="button"
                        variant={priority === level ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPriority(level)}
                        disabled={!user}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button type="submit" disabled={!user || !title.trim() || !description.trim()}>
                  <TicketPlus className="mr-2 h-4 w-4" />
                  Submit ticket
                </Button>
                {!user && (
                  <p className="text-sm text-muted-foreground">
                    Sign in to submit and track your tickets.
                  </p>
                )}
              </form>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TicketCheck className="h-4 w-4 text-primary" />
                  <p className="font-medium text-foreground">Your submitted tickets</p>
                </div>
                {userTickets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No tickets yet. Submit an issue above and it will show here after you log in.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {userTickets.map((ticket) => (
                      <div key={ticket.id} className="rounded-lg border p-4 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-medium text-foreground">{ticket.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Submitted {new Date(ticket.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">
                              Priority: {ticket.priority}
                            </span>
                            <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">
                              Status: {ticket.status.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                        <p className="mt-3 text-muted-foreground">{ticket.description}</p>
                        {ticket.status !== "resolved" && (
                          <div className="mt-3">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleResolveTicket(ticket.id)}
                            >
                              Mark as resolved
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
                  <Mail className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-medium text-foreground">Email support</p>
                  <a className="text-primary underline-offset-4 hover:underline" href="mailto:allankaoga1@gmail.com">
                    allankaoga1@gmail.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
                  <Phone className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-medium text-foreground">WhatsApp support</p>
                  <a
                    className="text-primary underline-offset-4 hover:underline"
                    href="https://wa.me/254742145267"
                    target="_blank"
                    rel="noreferrer"
                  >
                    0742145267
                  </a>
                </div>
              </div>
              <p>
                Reach out via email or WhatsApp for any issue and we will respond as quickly as possible.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
