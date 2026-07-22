"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Users, Dumbbell, Menu, X, LogOut, Calendar } from "lucide-react";
import { useState } from "react";
import { logoutUser } from "@/lib/actions/authActions";

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logoutUser();
    router.push('/login');
    router.refresh();
  };

  const navLinks = [
    { name: "Clientes", href: "/admin/clients", icon: Users },
    { name: "Ejercicios", href: "/admin/exercises", icon: Dumbbell },
    { name: "Calendario", href: "/admin/calendar", icon: Calendar },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-neutral-900 rounded-md border border-neutral-800 text-white print:hidden"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Overlay (Mobile) */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-neutral-950 border-r border-neutral-800 flex flex-col transition-transform duration-300 z-40 print:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo/Header */}
        <div className="p-6 border-b border-neutral-800 flex items-center justify-center">
          <img src="/logo.png" alt="Logo" className="w-40 h-auto" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);

            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-white/10 text-white font-medium"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                }`}
              >
                <Icon size={20} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer/Logout */}
        <div className="p-4 border-t border-neutral-800">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors rounded-lg"
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
