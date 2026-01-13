import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";

export const AppLayout = () => {
  return (
    <div className="h-screen w-screen bg-muted/40 flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};