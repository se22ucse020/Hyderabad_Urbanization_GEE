// ================================
// Hyderabad LULC - Year 2020
// ================================

// ---- Hyderabad Region of Interest ----
var hyderabad = ee.Geometry.Rectangle([78.2, 17.2, 78.6, 17.6]);
Map.centerObject(hyderabad, 9);

// ---- Cloud Mask for Landsat 8 (Collection 2 Level 2) ----
function maskL8(image) {
  var qa = image.select('QA_PIXEL');
  var cloud = qa.bitwiseAnd(1 << 5).neq(0);    // cloud bit
  var shadow = qa.bitwiseAnd(1 << 3).neq(0);   // cloud shadow bit
  return image.updateMask(cloud.not()).updateMask(shadow.not());
}

// ---- Load Landsat 8 for 2020 ----
var l8_2020 = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
  .filterBounds(hyderabad)
  .filterDate('2020-01-01', '2020-12-31')
  .filter(ee.Filter.lt('CLOUD_COVER', 20))
  .map(maskL8)
  .median()
  .clip(hyderabad);

// ---- True Color Visualization ----
var visL8_2020 = {
  bands: ['SR_B4', 'SR_B3', 'SR_B2'],
  min: 7000,
  max: 12000
};

Map.addLayer(l8_2020, visL8_2020, 'Landsat 8 - 2020');

// ---- TODO: Add classification code here ----
