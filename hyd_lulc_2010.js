// ================================
// Hyderabad LULC - Year 2010
// ================================

// ---- Hyderabad Region of Interest ----
var hyderabad = ee.Geometry.Rectangle([78.2, 17.2, 78.6, 17.6]);
Map.centerObject(hyderabad, 9);

// ---- Cloud Mask for Landsat 7 (Collection 2 Level 2) ----
function maskL7(image) {
  var qa = image.select('QA_PIXEL');
  var cloud = qa.bitwiseAnd(1 << 5).neq(0);    // cloud bit
  var shadow = qa.bitwiseAnd(1 << 3).neq(0);   // cloud shadow bit
  return image.updateMask(cloud.not()).updateMask(shadow.not());
}

// ---- Load Landsat 7 for 2010 ----
var l7_2010 = ee.ImageCollection("LANDSAT/LE07/C02/T1_L2")
  .filterBounds(hyderabad)
  .filterDate('2010-01-01', '2010-12-31')
  .filter(ee.Filter.lt('CLOUD_COVER', 20))
  .map(maskL7)
  .median()
  .clip(hyderabad);

// ---- True Color Visualization ----
var visL7_2010 = {
  bands: ['SR_B3', 'SR_B2', 'SR_B1'],
  min: 7000,
  max: 12000
};

Map.addLayer(l7_2010, visL7_2010, 'Landsat 7 - 2010');

// ---- TODO: Add classification code here ----
