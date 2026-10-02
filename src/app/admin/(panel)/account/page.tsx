import { requireAdmin } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/permissions";
import { PageTitle } from "@/components/admin/ui";
import { OwnPassword } from "@/components/admin/UserForms";
export const metadata = { title: "Account" };
export default async function Account() {
  const me = await requireAdmin();
  return (<><PageTitle title="My account" subtitle={`${me.name} · ${me.email} · ${ROLE_LABEL[me.role]}`} /><div className="card p-5"><OwnPassword /></div></>);
}
