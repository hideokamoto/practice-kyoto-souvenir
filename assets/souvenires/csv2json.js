const fs = require('fs');
const path = require('path')
const csvFilePath= path.join(__dirname, 'DSOURVENIR_0.csv')
const csv=require('csvtojson')

// DSOURVENIR_0.csv structure (only fields actually used by this script)
const headers = [
  'id',           // field1: ID
  'field2', 'field3', 'field4', 'field5', 'field6', 'field7', 'field8',
  'name',         // field9: 名前
  'name_kana',    // field10: 名前かな
  'field11', 'field12',
  'description'   // field13: 説明
  // Additional fields exist in CSV but are not used by this script
];

csv({
    noheader: true,
    headers: headers
})
.fromFile(csvFilePath)
.then((jsonObj)=>{
    const dataset = jsonObj.map(obj => ({
        id: obj.id,
        name: obj.name || '',
        name_kana: obj.name_kana || '',
        description: obj.description || ''
    }));
    const outputPath = path.join(__dirname, '../../src/app/pages/souvenir/dataset/kyoto-souvenir.json');
    fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 2));
    console.log(`✅ Generated ${outputPath}`);
})
.catch((error) => {
    console.error('❌ Error processing CSV file:', error.message);
    process.exit(1);
})