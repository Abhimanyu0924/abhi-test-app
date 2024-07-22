/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/rules-of-hooks */

import { useActionData,useLoaderData, useSubmit,useNavigate,useNavigation } from "@remix-run/react";
import React, {useState, useCallback, useEffect} from 'react';
import { authenticate } from "../shopify.server";
import { json,redirect } from "@remix-run/node";
import db from "../db.server";
import {getDiscountTable,validateForm} from "../models/discounts.server";
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
    PageActions
  } from "@shopify/polaris";

export async function loader({params,request}){
    // const {admin} = authenticate.admin(request);
    // const response = await admin.graphql(`
    // query getcurrency
    // {
    //   store
    //   {
    //     currrency{
    //       code
    //     }
    //   }

    // }`);
    // const parsedResponse = await response.json();
    // const currency = await parsedResponse.data.store.currency.code;
    if(params.id ==="new"){
        return json({
            offerName:"",
        });
    }
    const discountTable = await getDiscountTable(Number(params.id));

    return json({
        discountTable,
        // currency,
    });
}

export async function action({request,params}){
    const {admin,session} = await authenticate.admin(request);
    const {shop} = session;

    /**@type {any} */
    const data = {
        ...Object.fromEntries(await request.formData()),
        shop,
        
    };

    if(data.action === "delete"){
        await db.discountTable.delete({where:{id : Number(params.id)}});
        return redirect("/app");
    }
    const errors = validateForm(data);
    if(errors){
        return json({errors}, {status:422});
    }

    const discount = 
        params.id ==="new"
        ? await db.discountTable.create({
          data
        })
        : await db.discountTable.update({where : {id : Number(params.id)}}, {
          data
        });
      
        

        return redirect(`/app/discounts/${discount.id}`);

}

export default function discountForm(){
    
    const errors = useActionData()?.errors || {};
    const discounts = useLoaderData();

    const navigate = useNavigate();
    const nav = useNavigation();

    const [formState,setFormState]= useState(discounts);
    const [cleanFormState,setCleanFornState] = useState(discounts);

    const isDirty = JSON.stringify(formState)!== JSON.stringify(cleanFormState);
    const isSaving = nav.state === "submitting" && nav.formData?.get("action") !== "delete";
    const isDeleting = nav.state === "submitting" && nav.formData?.get("action") === "delete";


    function renderDiscountExample(value){
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

    const submit = useSubmit();
    function handleSave(){
      const data = {
        offerName : formState.offerName,
        offerType : formState.offerType,
        productName : (formState.productTitles),
        productId : (formState.productIds),
        productVariantId : (formState.productVariants),
        quantity : parseInt(0),
        discounting :parseInt(0),
        subDiscount : "",
        discountedAmount : parseInt(0),
        startDate : formState.startDate,
        endDate : formState.endDate
      }
      setCleanFornState({...formState});
      submit(data,{method:"post"});
    }
    

    const maxOffer = 5;
    const handleChange = useCallback(
      function(_,newValue){
        setFormState({ ...formState, subDiscount: newValue });
      },[]
    );

    async function selectProduct(){
        const products = await window.shopify.resourcePicker({
            type : "product",
            action : "select",
            multiple : "true"
        })
        const productIds = [];
        const productVariants = [];
        const productTitles = [];

        products.forEach(product => {
            productIds.push(product.id);
            productTitles.push(product.title);
            const variants = product.variants.map(variant => (
                variant.id
            ));
            productVariants.push(variants);
        });
        console.log('Product IDs:', JSON.stringify(productIds));
        console.log('Product Variants:', JSON.stringify(productVariants));
        console.log('Product Titles:', JSON.stringify(productTitles));
        setFormState({...formState,
            productIds:JSON.stringify(productIds),
            productTitles:JSON.stringify(productTitles),
            productVariants:JSON.stringify(productVariants),
        })
        
    }

    const today = new Date().toISOString().split("T")[0];

    const handleStartDateChange = useCallback((value) => {
        const currentDate = new Date().toISOString().split("T")[0];
        if(value<currentDate){
          return;
        }
        if(value > formState.endDate){
          setFormState({...formState, endDate:value})
        }
        setFormState({...formState, startDate:value})
      }, [formState.endDate]);
    
    const handleEndDateChange = useCallback((value) => {
        if(value<formState.startDate){
          return;
        }
        setFormState({...formState, endDate:value})

      }, [formState.startDate]);



      // <InlineStack wrap={false} align="space-around" >
      //                           <RadioButton
      //                           label = "% off each"
      //                           checked = {formState.subDiscount === 'percentage'}
      //                           name = "percentage"
      //                           id="percentage"
      //                           onChange={handleChange}
      //                           />
      //                           <RadioButton
      //                           label = "$ amount off each"
      //                           checked = {formState.subDiscount === 'amount'}
      //                           name = "amount"
      //                           id="amount"
      //                           onChange={handleChange}/>
      //                           <RadioButton
      //                           label = "$ each"
      //                           name = "each"
      //                           id="each"
      //                           checked = {formState.subDiscount === 'each'}
      //                           onChange={handleChange}/>
      //                       </InlineStack>
    return (
        <Page fullWidth>
            <ui-title-bar title={discounts.id?"Edit discount campaign":"Create discount campaign"}>
                <button variant="breadcrumb" onClick={()=>navigate("/app")}>
                    Discount Designer
                </button>
            </ui-title-bar>
            <Grid >
                <Grid.Cell columnSpan={{xs:3,sm:3,md:3,lg:6,xl:6}}>
                    <Card sectioned>
                        <BlockStack gap="500">
                                <TextField
                                    id="offerName"
                                    label="Offer Name"
                                    autoComplete="off"
                                    value={formState.offerName}
                                    onChange={(value) => setFormState({ ...formState, offerName: value })}
                                    error={errors.offerName}/>
                        </BlockStack>
                        <BlockStack gap="500">
                                <Select
                                label="Offer Type"
                                options={[
                                  { label: "Volume Discount", value: "volumeDiscount" },
                                  { label: "Spend Amount Discount", value: "spendAmountDiscount" },
                                  { label: "Buy X For $", value: "buyXForAmount" },
                                  { label: "Free Shipping", value: "freeShipping" },
                                ]}
                                value={formState.offerType}
                                onChange={(value) => {
                                  if (value >= 3 && value <= 40) {
                                      setFormState({ ...formState, offerName: value });
                                          }
                                      }}
                                />
                                <Text>Example : </Text>
                                <div style={{ marginTop: "10px" }}>{renderDiscountExample(formState.offerType)}</div>
                        </BlockStack >
                        <BlockStack gap="500">     
                            Select Product  
                            <Button 
                            id="products"
                            onClick={selectProduct}
                            >
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
                              content : "save",
                              loading: isSaving,
                              disabled: !isDirty || isSaving||isDeleting,
                              onAction : handleSave,
                            }}
                            secondaryActions = {{
                              content : "Delete",
                              loading : isDeleting,
                              disabled : !discounts.id|| !discounts|| isSaving|| isDeleting,
                              destructive : true,
                              outline : true,
                              onAction : ()=>submit({action : "delete"},{method:"post"})

                            }}
                            />
                        </BlockStack> 
                    </Card>
                </Grid.Cell>
            </Grid>
        </Page>
    );
}