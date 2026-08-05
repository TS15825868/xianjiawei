SELECT
  (SELECT COUNT(*) FROM app_records WHERE module='products' AND archived=0 AND id IN ('PROD-GAO-100','PROD-DRINK-30','PROD-DRINK-180','PROD-SOUP-75','PROD-JIAO-600','PROD-ANTLER-75')) AS products,
  (SELECT COUNT(*) FROM app_records WHERE module='inventory' AND archived=0) AS inventory,
  (SELECT COUNT(*) FROM app_records WHERE module='tasks' AND archived=0) AS tasks,
  (SELECT COUNT(*) FROM app_records WHERE module='suppliers' AND archived=0) AS suppliers,
  (SELECT COUNT(*) FROM app_records WHERE module='templates' AND archived=0) AS templates,
  (SELECT COUNT(*) FROM app_records WHERE module='documents' AND archived=0) AS documents,
  (SELECT COUNT(*) FROM products WHERE active=1 AND id IN ('PROD-GAO-100','PROD-DRINK-30','PROD-DRINK-180','PROD-SOUP-75','PROD-JIAO-600','PROD-ANTLER-75')) AS productRows,
  (SELECT COUNT(*) FROM inventory_items) AS inventoryRows,
  (
    SELECT COUNT(*) FROM app_records
    WHERE module='products' AND archived=0
      AND id NOT IN ('PROD-GAO-100','PROD-DRINK-30','PROD-DRINK-180','PROD-SOUP-75','PROD-JIAO-600','PROD-ANTLER-75')
  ) + (
    SELECT COUNT(*) FROM products
    WHERE active=1
      AND id NOT IN ('PROD-GAO-100','PROD-DRINK-30','PROD-DRINK-180','PROD-SOUP-75','PROD-JIAO-600','PROD-ANTLER-75')
  ) AS unexpectedProductCount,
  (SELECT COALESCE(SUM(duplicate_count),0) FROM (
    SELECT COUNT(*) - 1 AS duplicate_count
    FROM inventory_items
    GROUP BY COALESCE(product_id,''), COALESCE(item_type,''), trim(COALESCE(name,'')), trim(COALESCE(unit,'')), COALESCE(location,'')
    HAVING COUNT(*) > 1
  )) AS inventoryDuplicateCount,
  (SELECT COUNT(*) FROM social_posts) AS postCount,
  (SELECT COUNT(*) FROM social_posts WHERE status IN ('draft','pending_review','rejected') AND scheduled_at IS NULL) AS pendingReviewCount,
  (SELECT COUNT(*) FROM social_posts WHERE status NOT IN ('published','archived') AND (approved_at IS NULL OR approved_at='') AND scheduled_at IS NOT NULL) AS activeUnreviewedCount,
  (SELECT COUNT(*) FROM social_posts WHERE image_url IS NOT NULL AND trim(image_url)<>'') AS postImageCount,
  (SELECT COUNT(*) FROM social_posts WHERE copy IS NOT NULL AND trim(copy)<>'') AS postCopyCount,
  (SELECT COUNT(*) FROM social_posts WHERE image_url IS NOT NULL AND trim(image_url)<>'' AND copy IS NOT NULL AND trim(copy)<>'') AS publishReadyPostCount,
  (SELECT COUNT(*) FROM app_records WHERE module='products' AND archived=0 AND id IN ('PROD-SOUP-150','PROD-SOUP-300','PROD-SOUP-600')) AS obsoleteProductCount,
  (SELECT COUNT(*) FROM inventory_items WHERE id IN ('INV-SOUP-300','INV-SOUP-600','INV-QIXUAN-20','INV-PKG-SOUP300')) AS obsoleteInventoryCount,
  (SELECT COUNT(*) FROM app_records WHERE module='system_migrations' AND id='official_product_price_migration_20260804_v2' AND archived=0) AS officialPriceMigrationMarkerCount,
  (SELECT COUNT(*) FROM app_records WHERE module='system_migrations' AND id='official_product_specification_migration_20260805_v2' AND archived=0) AS officialSpecificationMigrationMarkerCount,
  (
    SELECT COUNT(*) FROM app_records
    WHERE module='products' AND archived=0 AND json_valid(data_json)=1 AND (
      (id='PROD-GAO-100' AND (CAST(COALESCE(json_extract(data_json,'$.retail_price'),0) AS INTEGER)<>2100 OR CAST(COALESCE(json_extract(data_json,'$.promotional_price'),0) AS INTEGER)<>1800 OR CAST(COALESCE(json_extract(data_json,'$.wholesale_price'),0) AS INTEGER)<>700))
      OR (id='PROD-DRINK-30' AND CAST(COALESCE(json_extract(data_json,'$.retail_price'),0) AS INTEGER)<>50)
      OR (id='PROD-DRINK-180' AND (CAST(COALESCE(json_extract(data_json,'$.retail_price'),0) AS INTEGER)<>200 OR CAST(COALESCE(json_extract(data_json,'$.wholesale_price'),0) AS INTEGER)<>80))
      OR (id='PROD-SOUP-75' AND (CAST(COALESCE(json_extract(data_json,'$.retail_price'),0) AS INTEGER)<>1600 OR CAST(COALESCE(json_extract(data_json,'$.wholesale_price'),0) AS INTEGER)<>700))
      OR (id='PROD-JIAO-600' AND (CAST(COALESCE(json_extract(data_json,'$.retail_price'),0) AS INTEGER)<>12000 OR CAST(COALESCE(json_extract(data_json,'$.promotional_price'),0) AS INTEGER)<>9600 OR CAST(COALESCE(json_extract(data_json,'$.wholesale_price'),0) AS INTEGER)<>5000))
      OR (id='PROD-ANTLER-75' AND CAST(COALESCE(json_extract(data_json,'$.retail_price'),0) AS INTEGER)<>2000)
    )
  ) + (
    SELECT COUNT(*) FROM products WHERE
      (id='PROD-GAO-100' AND (retail_price<>2100 OR COALESCE(promo_price,0)<>1800 OR wholesale_price<>700))
      OR (id='PROD-DRINK-30' AND retail_price<>50)
      OR (id='PROD-DRINK-180' AND (retail_price<>200 OR wholesale_price<>80))
      OR (id='PROD-SOUP-75' AND (retail_price<>1600 OR wholesale_price<>700))
      OR (id='PROD-JIAO-600' AND (retail_price<>12000 OR COALESCE(promo_price,0)<>9600 OR wholesale_price<>5000))
      OR (id='PROD-ANTLER-75' AND retail_price<>2000)
  ) AS knownLegacyPriceCount,
  (
    SELECT COUNT(*) FROM app_records
    WHERE module='products' AND archived=0 AND json_valid(data_json)=1 AND (
      (id='PROD-GAO-100' AND (trim(COALESCE(json_extract(data_json,'$.name'),''))<>'仙加味・龜鹿膏' OR trim(COALESCE(json_extract(data_json,'$.specification'),''))<>'100g／罐' OR trim(COALESCE(json_extract(data_json,'$.unit'),''))<>'罐'))
      OR (id='PROD-DRINK-30' AND (trim(COALESCE(json_extract(data_json,'$.name'),''))<>'仙加味・龜鹿飲30cc玻璃罐' OR trim(COALESCE(json_extract(data_json,'$.specification'),''))<>'30cc／罐（小玻璃罐）' OR trim(COALESCE(json_extract(data_json,'$.unit'),''))<>'罐'))
      OR (id='PROD-DRINK-180' AND (trim(COALESCE(json_extract(data_json,'$.name'),''))<>'仙加味・龜鹿飲180cc鋁袋' OR trim(COALESCE(json_extract(data_json,'$.specification'),''))<>'180cc／包（鋁袋）' OR trim(COALESCE(json_extract(data_json,'$.unit'),''))<>'包'))
      OR (id='PROD-SOUP-75' AND (trim(COALESCE(json_extract(data_json,'$.name'),''))<>'仙加味・龜鹿湯塊' OR trim(COALESCE(json_extract(data_json,'$.specification'),''))<>'75g／盒｜8塊裝｜每塊約9.375g' OR trim(COALESCE(json_extract(data_json,'$.unit'),''))<>'盒'))
      OR (id='PROD-JIAO-600' AND (trim(COALESCE(json_extract(data_json,'$.name'),''))<>'仙加味・龜鹿膠' OR trim(COALESCE(json_extract(data_json,'$.specification'),''))<>'600g（1斤）／盒｜32塊裝｜每塊約18.75g' OR trim(COALESCE(json_extract(data_json,'$.unit'),''))<>'盒'))
      OR (id='PROD-ANTLER-75' AND (trim(COALESCE(json_extract(data_json,'$.name'),''))<>'仙加味・鹿茸粉' OR trim(COALESCE(json_extract(data_json,'$.specification'),''))<>'75g／罐' OR trim(COALESCE(json_extract(data_json,'$.unit'),''))<>'罐'))
      OR id IN ('PROD-SOUP-150','PROD-SOUP-300','PROD-SOUP-600')
    )
  ) + (
    SELECT COUNT(*) FROM products WHERE
      (id='PROD-GAO-100' AND (trim(COALESCE(name,''))<>'仙加味・龜鹿膏' OR trim(COALESCE(specification,''))<>'100g／罐' OR trim(COALESCE(unit,''))<>'罐'))
      OR (id='PROD-DRINK-30' AND (trim(COALESCE(name,''))<>'仙加味・龜鹿飲30cc玻璃罐' OR trim(COALESCE(specification,''))<>'30cc／罐（小玻璃罐）' OR trim(COALESCE(unit,''))<>'罐'))
      OR (id='PROD-DRINK-180' AND (trim(COALESCE(name,''))<>'仙加味・龜鹿飲180cc鋁袋' OR trim(COALESCE(specification,''))<>'180cc／包（鋁袋）' OR trim(COALESCE(unit,''))<>'包'))
      OR (id='PROD-SOUP-75' AND (trim(COALESCE(name,''))<>'仙加味・龜鹿湯塊' OR trim(COALESCE(specification,''))<>'75g／盒｜8塊裝｜每塊約9.375g' OR trim(COALESCE(unit,''))<>'盒'))
      OR (id='PROD-JIAO-600' AND (trim(COALESCE(name,''))<>'仙加味・龜鹿膠' OR trim(COALESCE(specification,''))<>'600g（1斤）／盒｜32塊裝｜每塊約18.75g' OR trim(COALESCE(unit,''))<>'盒'))
      OR (id='PROD-ANTLER-75' AND (trim(COALESCE(name,''))<>'仙加味・鹿茸粉' OR trim(COALESCE(specification,''))<>'75g／罐' OR trim(COALESCE(unit,''))<>'罐'))
      OR id IN ('PROD-SOUP-150','PROD-SOUP-300','PROD-SOUP-600')
  ) AS knownLegacySpecificationCount,
  (
    SELECT COUNT(*) FROM app_records
    WHERE module='products' AND archived=0 AND json_valid(data_json)=1 AND (
      (id IN ('PROD-DRINK-30','PROD-DRINK-180') AND (
        trim(COALESCE(json_extract(data_json,'$.fulfillment_type'),''))<>'made-to-order-drink'
        OR COALESCE(json_extract(data_json,'$.ready_stock'),1)<>0
        OR instr(COALESCE(json_extract(data_json,'$.fulfillment_notice'),''),'5～7個工作天')=0
      ))
      OR (id IN ('PROD-GAO-100','PROD-SOUP-75','PROD-JIAO-600','PROD-ANTLER-75') AND (
        trim(COALESCE(json_extract(data_json,'$.fulfillment_type'),''))<>'ready-stock'
        OR COALESCE(json_extract(data_json,'$.ready_stock'),0)<>1
        OR instr(COALESCE(json_extract(data_json,'$.fulfillment_notice'),''),'預先製作備貨商品')=0
        OR instr(COALESCE(json_extract(data_json,'$.fulfillment_notice'),''),'5～7個工作天')>0
      ))
    )
  ) AS fulfillmentPolicyMismatchCount;
