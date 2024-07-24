
import {
  useActionData,
  useLoaderData,
  useSubmit,
  useNavigate,
  useNavigation,
} from "@remix-run/react";
import React, { useState, useCallback, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { json, redirect } from "@remix-run/node";
import db from "../db.server";
import { getDiscountTable, validateForm } from "../models/discounts.server";
import {
  Box,
  Card,
  Layout,
  Link,
  List,
  Page,
  Text,
  BlockStack,
  TextField,
  Grid,
  Select,
  Button,
  Tag,
  RadioButton,
  InlineStack,
  PageActions,
  LegacyStack,
  Icon,
  FormLayout,
} from "@shopify/polaris";
import { MinusCircleIcon } from "@shopify/polaris-icons";


export async function loader({ params, request }) {
  if (params.id === "new") {
    return json({
      offerName: "",
      offerType: "",
      subDiscount: "",
      offers: [],
    });
  }
  const discountTable = await getDiscountTable(Number(params.id));
  return json(discountTable);
}

export async function action({ request, params }) {
  const { admin, session } = await authenticate.admin(request);
  const { shop } = session;

  const data = {
    ...Object.fromEntries(await request.formData()),
    shop,
  };

  if (data.action === "delete") {
    await db.discountTable.delete({ where: { id: Number(params.id) } });
    return redirect("/app");
  }

  const errors = validateForm(data);
  if (errors) {
    return json({ errors }, { status: 422 });
  }

  const discount =
    params.id === "new"
      ? await db.discountTable.create({ data })
      : await db.discountTable.update({
          where: { id: Number(params.id) },
          data,
        });

  return redirect(`/app/discounts/${discount.id}`);
}

export default function DiscountForm() {
  const errors = useActionData()?.errors || {};
  const discounts = useLoaderData();

  const navigate = useNavigate();
  const nav = useNavigation();

  const [formState, setFormState] = useState(discounts);
  const [cleanFormState, setCleanFormState] = useState(discounts);

  const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState);
  const isSaving =
    nav.state === "submitting" && nav.formData?.get("action") !== "delete";
  const isDeleting =
    nav.state === "submitting" && nav.formData?.get("action") === "delete";


    
  const quantity = (formState.offers).map(item => item.quantity );
  const discountAmount = (formState.offers).map(item => item.discountAmount );

  const handlesubDiscountChange = (type) => {
    setFormState({ ...formState, subDiscount: type });
  };

  const maxOffers = 5;

  const handleAddOffer = () => {
    if (formState.offers.length < maxOffers) {
      const newOffer = {
        quantity: '',
        discountAmount: '',
      };
      const updatedOffers = [...formState.offers, newOffer];
      setFormState({ ...formState, offers: updatedOffers });
    }
  };

  const handleRemoveOffer = (index) => {
    const updatedOffers = [...formState.offers];
    updatedOffers.splice(index, 1);
    setFormState({ ...formState, offers: updatedOffers });
  };

  const handleOfferFieldChange = (index, field, value) => {
    const updatedOffers = formState.offers.map((offer, i) => {
      if (i === index) {
        return { ...offer, [field]: value };
      }
      return offer;
    }); 
    
    setFormState({ ...formState, offers: updatedOffers });
    
  };
  
  const renderOfferRows = () => {
    return formState.offers.map((offer, index) => (
      <div key={index} style={{ marginTop: '10px', marginBottom: '10px' }}>
        <FormLayout.Group condensed>
          <TextField
            type="number"
            value={offer.quantity}
            placeholder="Quantity"
            onChange={(value) => handleOfferFieldChange(index, 'quantity', value)}
          />
          <TextField
            type="number"
            value={offer.discountAmount}
            placeholder={`Discount $`}
            onChange={(value) => handleOfferFieldChange(index, 'discountAmount', value)}
          />
          
          <Button onClick={() => handleRemoveOffer(index)}>
            <Icon source={MinusCircleIcon} />
          </Button>
        </FormLayout.Group>
      </div>
    ));
  };

  function renderDiscountExample(value) {
    switch (value) {
      case "volumeDiscount":
        return (
          <BlockStack>
            <ul>
              <li>Buy 5 or more - get 10% Off</li>
              <li>Buy 10 or more - get 20% Off</li>
            </ul>
          </BlockStack>
        );
      case "spendAmountDiscount":
        return (
          <BlockStack>
            <ul>
              <li>
                Spend over $400 on the Summer Collection - get 20% off each
                Summer Collection item
              </li>
              <li>Spend over $100 on Sneakers - get $5.00 off the order</li>
            </ul>
          </BlockStack>
        );
      case "buyXForAmount":
        return (
          <BlockStack>
            <ul>
              <li>3 items from the Summer Collection for $10.00</li>
              <li>2 shoes for $10.00</li>
            </ul>
          </BlockStack>
        );
      case "freeShipping":
        return (
          <BlockStack>
            <ul>
              <li>Get X quantity to get the free shipping option</li>
            </ul>
          </BlockStack>
        );
      default:
        return (
          <BlockStack>
            <ul>
              <li>Buy 5 or more - get 10% Off</li>
              <li>Buy 10 or more - get 20% Off</li>
            </ul>
          </BlockStack>
        );
    }
  }

  function convertToIso(dateString) {
    const date = new Date(dateString);
    return date.toISOString();
  }

  const start = formState.startDate;
  const end = formState.endDate;
  const submit = useSubmit();

  function handleSave() {
    const data = {
      offerName: formState.offerName,
      offerType: formState.offerType,
      productName: formState.productTitles,
      productId: formState.productIds,
      productVariantId: formState.productVariants,
      quantity: JSON.stringify(quantity),
      discounting: JSON.stringify(discountAmount),
      subDiscount: formState.subDiscount,
      discountedAmount: "0",
      startDate: convertToIso(start),
      endDate: convertToIso(end),
    };
    setCleanFormState({ ...formState });
    submit(data, { method: "post" });
  }

  async function selectProduct() {
    const products = await window.shopify.resourcePicker({
      type: "product",
      action: "select",
      multiple: true,
    });
    const productIds = [];
    const productVariants = [];
    const productTitles = [];

    products.forEach((product) => {
      productIds.push(product.id);
      productTitles.push(product.title);
      const variants = product.variants.map((variant) => variant.id);
      productVariants.push(variants);
    });
    console.log("Product IDs:", JSON.stringify(productIds));
    console.log("Product Variants:", JSON.stringify(productVariants));
    console.log("Product Titles:", JSON.stringify(productTitles));
    setFormState({
      ...formState,
      productIds: JSON.stringify(productIds),
      productTitles: JSON.stringify(productTitles),
      productVariants: JSON.stringify(productVariants),
    });
  }
  
  const today = new Date().toISOString().split("T")[0];

  const handleStartDateChange = useCallback(
    (value) => {
      const currentDate = new Date().toISOString().split("T")[0];
      if (value < currentDate) {
        return;
      }
      if (value > formState.endDate) {
        setFormState({ ...formState, endDate: value });
        
      }
      setFormState({ ...formState, startDate: value });
      
    },
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [formState],
  );

  const handleEndDateChange = useCallback(
    (value) => {
      if (value < formState.startDate) {
        return;
      }
      setFormState({ ...formState, endDate: value });
    },
    [formState],
  );

  return (
    <Page fullWidth>
      <ui-title-bar
        title={
          discounts.id ? "Edit discount campaign" : "Create discount campaign"
        }
      >
        <button variant="breadcrumb" onClick={() => navigate("/app")}>
          Discount Designer
        </button>
      </ui-title-bar>
      <Grid>
        <Grid.Cell columnSpan={{ xs: 3, sm: 3, md: 3, lg: 6, xl: 6 }}>
          <Card sectioned>
            <BlockStack gap="500">
              <TextField
                id="offerName"
                label="Offer Name"
                autoComplete="off"
                value={formState.offerName}
                onChange={(value) => {
                  setFormState({ ...formState, offerName: value });
                }}
                error={errors.offerName}
              />
            </BlockStack>
            <BlockStack gap="500">
              <Select
                label="Offer Type"
                options={[
                  { label: "Volume Discount", value: "volumeDiscount" },
                  {
                    label: "Spend Amount Discount",
                    value: "spendAmountDiscount",
                  },
                  { label: "Buy X For $", value: "buyXForAmount" },
                  { label: "Free Shipping", value: "freeShipping" },
                ]}
                value={formState.offerType}
                onChange={(value) => {
                  setFormState({ ...formState, offerType: value });
                }}
              />
              <Text>Example : </Text>
              <div style={{ marginTop: "10px" }}>
                {renderDiscountExample(formState.offerType)}
              </div>
            </BlockStack>
            <FormLayout.Group condensed title="Offer Details">
              <LegacyStack horizontal>
                <RadioButton
                  label="% off each"
                  checked={formState.subDiscount === "percentage"}
                  id="percentage"
                  name="subDiscount"
                  onChange={() => handlesubDiscountChange("percentage")}
                />
                <RadioButton
                  label={`$ Amount off each`}
                  id="amount"
                  name="subDiscount"
                  checked={formState.subDiscount === "amount"}
                  onChange={() => handlesubDiscountChange("amount")}
                />
                <RadioButton
                  label={`$ each`}
                  id="each"
                  name="subDiscount"
                  checked={formState.subDiscount === "each"}
                  onChange={() => handlesubDiscountChange("each")}
                />
              </LegacyStack>
            </FormLayout.Group>

            <div style={{ marginTop: "10px" }}>{renderOfferRows()}</div>
            {formState.subDiscount && formState.offers.length < maxOffers && (
              <Button primary onClick={handleAddOffer}>
                Add Offer
              </Button>
            )}
            <BlockStack gap="500">
              Select Product
              <Button id="products" onClick={selectProduct}>
                Select Products
              </Button>
              <Text></Text>
              <BlockStack gap="500">
                <TextField
                  type="date"
                  value={formState.startDate}
                  label="Start Date"
                  onChange={handleStartDateChange}
                  min={today}
                />
                <TextField
                  type="date"
                  value={formState.endDate}
                  label="End Date"
                  onChange={handleEndDateChange}
                  min={formState.startDate}
                />
              </BlockStack>
              <PageActions
                primaryAction={{
                  content: "save",
                  loading: isSaving,
                  disabled: !isDirty || isSaving || isDeleting,
                  onAction: handleSave,
                }}
                secondaryActions={{
                  content: "Delete",
                  loading: isDeleting,
                  disabled:
                    !discounts.id || !discounts || isSaving || isDeleting,
                  destructive: true,
                  outline: true,
                  onAction: () =>
                    submit({ action: "delete" }, { method: "post" }),
                }}
              />
            </BlockStack>
          </Card>
        </Grid.Cell>
      </Grid>
    </Page>
  );
}
