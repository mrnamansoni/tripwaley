import AdminApp from "@/components/admin/AdminApp";

/* Session already verified by src/proxy.ts before this renders. */
export default function AdminHome() {
  return <AdminApp />;
}
