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
// ================== CLASSIFICATION BLOCK ==================

// STEP 1: Add NDVI & NDBI
var img = l7_2000;   // <--- THIS is where l7_2000 must be used

var ndvi = img.normalizedDifference(['SR_B4', 'SR_B3']).rename('NDVI');
var ndbi = img.normalizedDifference(['SR_B6', 'SR_B5']).rename('NDBI');

var stacked = img.addBands(ndvi).addBands(ndbi);

// STEP 2: TRAINING DATA (You draw these in GEE manually)
// You must create 4 FeatureCollections in the GEE left panel:
// urban, veg, water, soil — each with property "class"
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

// STEP 5: Visualize
var palette = [
  'ff0000', // Urban
  '00ff00', // Vegetation
  '0000ff', // Water
  'ffff00'  // Soil
];

Map.addLayer(classified, {min: 1, max: 4, palette: palette}, 'LULC 2000');

// STEP 6: Calculate built-up area (class = 1)
var urbanMask = classified.eq(1);
var pixelArea = ee.Image.pixelArea().updateMask(urbanMask);

var area = pixelArea.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: hyderabad,
  scale: 30,
  maxPixels: 1e13
});

print('Urban area (sq meters) 2000:', area.get('area'));
print('Urban area (sq km) 2000:', ee.Number(area.get('area')).divide(1e6));

// STEP 7: Export
Export.image.toDrive({
  image: classified,
  description: 'Hyderabad_LULC_2000',
  scale: 30,
  region: hyderabad,
  maxPixels: 1e13
});
