import { redirect } from "next/navigation";

/** `/admin/boutique` n'est pas une page : on ouvre les commandes à traiter. */
export default function AdminShopIndex() {
  redirect("/admin/boutique/a-traiter");
}
