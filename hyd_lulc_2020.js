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
// ================== CLASSIFICATION BLOCK ==================

// STEP 1: Add NDVI & NDBI
var img = l8_2020;   // <--- IMPORTANT: use l8_2020 for year 2020

var ndvi = img.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI');
var ndbi = img.normalizedDifference(['SR_B6', 'SR_B5']).rename('NDBI');

var stacked = img.addBands(ndvi).addBands(ndbi);

// STEP 2: TRAINING DATA (draw these in GEE map editor)
// You must draw: urban, veg, water, soil (4 feature collections)
var trainingFC = urban.merge(veg).merge(water).merge(soil);

var training = stacked.sampleRegions({
  collection: trainingFC,
  properties: ['class'],
  scale: 30,
  tileScale: 4
});

// STEP 3: Train classifier
var classifier = ee.Classifier.smileRandomForest(100)
  .train({
    features: training,
    classProperty: 'class',
    inputProperties: stacked.bandNames()
  });

// STEP 4: Classify
var classified = stacked.classify(classifier);

// STEP 5: Visualization
var palette = [
  'ff0000', // Urban
  '00ff00', // Vegetation
  '0000ff', // Water
  'ffff00'  // Soil
];

Map.addLayer(classified, {min: 1, max: 4, palette: palette}, 'LULC 2020');

// STEP 6: Calculate built-up area (class = 1)
var urbanMask = classified.eq(1);
var pixelArea = ee.Image.pixelArea().updateMask(urbanMask);

var area = pixelArea.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: hyderabad,
  scale: 30,
  maxPixels: 1e13
});

print('Urban area (sq m) 2020:', area.get('area'));
print('Urban area (sq km) 2020:', ee.Number(area.get('area')).divide(1e6));

// STEP 7: Export
Export.image.toDrive({
  image: classified,
  description: 'Hyderabad_LULC_2020',
  scale: 30,
  region: hyderabad,
  maxPixels: 1e13
});

