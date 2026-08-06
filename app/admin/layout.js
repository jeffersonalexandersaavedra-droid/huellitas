import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function AdminLayout({ children }) {
  return (
    <div className="flex h-dvh">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-stone-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
