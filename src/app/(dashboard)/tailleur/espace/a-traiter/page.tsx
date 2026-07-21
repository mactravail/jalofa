import type { Metadata } from "next";

import { OrdersPageView } from "@/components/dashboard/orders-page-view";

export const metadata: Metadata = { title: "À traiter" };

export default function TailorTodoPage() {
  return <OrdersPageView role="tailor" bucket="todo" />;
}
