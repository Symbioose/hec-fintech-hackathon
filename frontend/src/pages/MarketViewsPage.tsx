import { Link } from "react-router-dom";
import { MARKET_VIEWS } from "@/mocks/marketViews";
import { PageHeader } from "@/components/common/PageHeader";
import { MarketViewCard } from "@/components/common/MarketViewCard";
import { useAppStore } from "@/lib/store";
import { affectedCount } from "@/lib/marketAlignment";

export default function MarketViewsPage() {
  const { products } = useAppStore();
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        eyebrow="Context"
        title="Market views"
        description="Internal research notes used by the matching engine to bias recommendations."
      />
      <div className="space-y-3">
        {MARKET_VIEWS.map((mv) => {
          const n = affectedCount(mv, products);
          return (
            <MarketViewCard
              key={mv.id}
              view={mv}
              footer={
                n > 0 ? (
                  <Link
                    to="/products"
                    className="text-[11px] text-primary hover:underline"
                  >
                    Affects {n} product{n > 1 ? "s" : ""} in your catalog →
                  </Link>
                ) : (
                  <span className="text-[11px] text-muted-foreground">
                    No products in your catalog directly affected.
                  </span>
                )
              }
            />
          );
        })}
      </div>
    </div>
  );
}
