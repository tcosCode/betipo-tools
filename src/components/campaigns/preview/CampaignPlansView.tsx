import Box from "@mui/material/Box";

import type { PlanModalTemplate } from "../../../features/campaigns/campaign-schema";
import { Banner } from "./Banner";
import { Cards } from "./Cards";
import { Footer } from "./Footer";

interface CampaignPlansViewProps {
  template: PlanModalTemplate;
  activePlanUuid?: string;
}

export function CampaignPlansView({
  template,
  activePlanUuid,
}: Readonly<CampaignPlansViewProps>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Banner header={template.header} generalData={template.generalData} />
      <Cards
        cards={template.cards}
        generalData={template.generalData}
        activePlanUuid={activePlanUuid}
        onSelectPlan={() => undefined}
      />
      <Footer footer={template.footer} generalData={template.generalData} />
    </Box>
  );
}
