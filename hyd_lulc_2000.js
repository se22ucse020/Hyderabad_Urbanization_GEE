// Hyderabad ROI
var hyderabad = ee.Geometry.Rectangle([78.2, 17.2, 78.6, 17.6]);
Map.centerObject(hyderabad, 9);

// Landsat 7 for 2000
var l7 = ee.ImageCollection("LANDSAT/LE07/C02/T1_L2")
  .filterDate('2000-01-01', '2000-12-31')
  .filterBounds(hyderabad)
  .filter(ee.Filter.lt('CLOUD_COVER', 20))
  .median();

var visL7 = {bands: ['SR_B3','SR_B2','SR_B1'], min: 7000, max: 12000};
Map.addLayer(l7.clip(hyderabad), visL7, 'Landsat 7 - 2000');
