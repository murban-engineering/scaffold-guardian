import { Mail, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Settings = () => {
  const navigate = useNavigate();

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
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeItem="settings" onItemClick={handleSidebarItemClick} />

      <main className="ml-64">
        <Header title="Settings" subtitle="Manage support contacts and help resources." />

        <div className="p-6 space-y-6">
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
