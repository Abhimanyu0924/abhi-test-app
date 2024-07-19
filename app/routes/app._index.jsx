import { json } from "@remix-run/node";
import {  useLoaderData, useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import {getDiscounts} from "../models/discounts.server"
import { Card, EmptyState, IndexTable, Layout, Link, Page } from "@shopify/polaris";

export const loader = async ({ request }) => {
  const {session} = await authenticate.admin(request);
  const allDiscounts = await getDiscounts(session.shop);
  return json({
    allDiscounts
  });
};

function truncat(str,{length = 25}= {}){
  if (!str) return"";
  if(str.length<=length) return "";
  return str.slice(0,length)+"...";
}

function status(startDate,endDate){ // might not work, have to see date formate
  const currentDate = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  if(currentDate >= start && currentDate<=end) return "Campaign running";
  return "Campaign Ended";
}

const EmptyDiscountState = ({onAction}) =>(
  <EmptyState
  heading="Create unique discounts for your products"
  action={{
    content:"Create Discount",
    onAction,
  }}
  image = "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
  >
    <p>Allow merchant to create discounts and analyse profit margins</p>
  </EmptyState>
);


const CampaignTable = ({allDiscounts})=> (
  <IndexTable
  resourceName={{
    singular : "Discount",
    plural : "Discounts"
  }}
  itemCount={allDiscounts.length}
  headings={[
    {title : "Offer Name"},
    {title : "Offer Type"},
    {title : "Start Date"},
    {title : "End Date"},
    {title : "Status"}
  ]}
  selectable={false}
  >
   {allDiscounts.map((discounts)=>(
    <CampaignTableRow key = {discounts.id} discounts={discounts}/>
   ))} 
  </IndexTable>
);

const CampaignTableRow = ({discounts})=>(
  <IndexTable.Row id = {discounts.id} position={discounts.id}>
    <IndexTable.Cell>
      <Link to={`discounts/${discounts.id}`} >{truncat(discounts.offerName)} </Link>
    </IndexTable.Cell>
    <IndexTable.Cell>
      {discounts.offerType}
    </IndexTable.Cell>
    <IndexTable.Cell>
      {new Date(discounts.startDate).toDateString()}
    </IndexTable.Cell>
    <IndexTable.Cell>
      {new Date(discounts.endDate).toDateString()}
    </IndexTable.Cell>
    <IndexTable.Cell>
      {(status((new Date(discounts.startDate)),(new Date(discounts.endDate)))) || ""} 
    </IndexTable.Cell>
  </IndexTable.Row>
); // 

export default function Index() {
  const {allDiscounts} = useLoaderData();
  const navigate = useNavigate();
  return (
    <Page>
      <ui-title-bar title = "Discount Campaigns">
        <button variant = "primary" onClick={()=>navigate("/app/discounts/new")}>
          Create Discount
        </button>
      </ui-title-bar>
      <Layout>
        <Layout.Section>
          <Card padding = "0">
            {
            allDiscounts.length===0 ? ( <EmptyDiscountState onAction={()=>navigate("discounts/new")}/>)
            :
            (<CampaignTable allDiscounts={allDiscounts}/>)
            }
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
   );
}
