// --- Define Hyderabad region (approximate bounding box) ---
var hyderabad = ee.Geometry.Rectangle([78.2, 17.2, 78.6, 17.6]);
Map.centerObject(hyderabad, 9);

// ====== LANDSAT 5 (1990) ======
var l5 = ee.ImageCollection("LANDSAT/LT05/C02/T1_L2")
  .filterDate('1990-01-01', '1990-12-31')
  .filterBounds(hyderabad)
  .filter(ee.Filter.lt('CLOUD_COVER', 20))
  .median();

// Visualize Landsat 5
var visL5 = {bands: ['SR_B3','SR_B2','SR_B1'], min: 7000, max: 12000};
Map.addLayer(l5.clip(hyderabad), visL5, 'Landsat 5 - 1990');

// --- TODO: Add classification next ---
