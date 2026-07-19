import Box from "@mui/material/Box";

import type { PlanModalTemplate } from "../../../features/campaigns/campaign-schema";
import { PlanCard } from "./PlanCard";

interface CardsProps {
  cards: PlanModalTemplate["cards"];
  generalData: PlanModalTemplate["generalData"];
  activePlanUuid?: string;
  onSelectPlan: (planUuid: string) => void;
}

export function Cards({
  cards,
  generalData,
  activePlanUuid,
  onSelectPlan,
}: Readonly<CardsProps>) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      {cards.map((card) => (
        <PlanCard
          key={card.planUuid || card.planTitle.text}
          card={card}
          generalData={generalData}
          onSelect={onSelectPlan}
          isActivePlan={card.planUuid === activePlanUuid}
        />
      ))}
    </Box>
  );
}
