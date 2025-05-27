```javascript
// Google Apps Script Code (Code.gs)

const SPREADSHEET_ID = '12GRlUWqQ4p0Ecu7Sx16waKIfjWCy3L1-OVk-joU6EWI';
const PRODUCTS_SHEET_NAME = 'منتجات';
const SALES_SHEET_NAME = 'المبيعات';
const PRODUCTS_DATA_RANGE = 'A4:C'; // Read until the last row with data in columns A, B, C
const SALES_DATA_RANGE = 'A4:D';    // Read until the last row with data in columns A, B, C, D

/**
 * Handles GET requests to the web app.
 * Routes requests based on the 'action' parameter.
 */
function doGet(e) {
  try {
    const action = e.parameter.action;

    if (action === 'getProducts') {
      return getProducts();
    } else if (action === 'getSales') {
      // Optional: Add parameters for date filtering if needed
      // const startDate = e.parameter.startDate;
      // const endDate = e.parameter.endDate;
      return getSales();
    } else if (action === 'appendSale') {
       // It's better practice to use doPost for actions that modify data,
       // but we'll keep doGet for now to match the existing frontend call.
       // Consider switching both frontend and backend to doPost later.
      return appendSale(e);
    }
     else {
      return createJsonResponse({ success: false, error: 'Invalid action specified.' });
    }
  } catch (error) {
    Logger.log('Error in doGet: ' + error);
    return createJsonResponse({ success: false, error: 'An unexpected error occurred: ' + error.message });
  }
}

/**
 * Fetches product data from the spreadsheet.
 * Reads columns: Name (A), Price (B), Quantity (C).
 */
function getProducts() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(PRODUCTS_SHEET_NAME);
    if (!sheet) {
      return createJsonResponse({ success: false, error: `Sheet '${PRODUCTS_SHEET_NAME}' not found.` });
    }
    // Get data, filter out rows where the first column (product name) is empty
    const range = sheet.getRange(PRODUCTS_DATA_RANGE + sheet.getLastRow());
    const values = range.getValues().filter(row => row[0] && String(row[0]).trim() !== '');

    const products = values.map(row => ({
      name: String(row[0]).trim(),
      price: parseFloat(row[1]) || 0,
      qty: parseInt(row[2]) || 0
    }));

    return createJsonResponse({ success: true, data: products });
  } catch (error) {
    Logger.log('Error fetching products: ' + error);
    return createJsonResponse({ success: false, error: 'Failed to fetch products: ' + error.message });
  }
}

/**
 * Appends a sale record to the spreadsheet.
 * Expects parameters: date, product, total, soldQty.
 */
function appendSale(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SALES_SHEET_NAME);
    if (!sheet) {
      return createJsonResponse({ success: false, error: `Sheet '${SALES_SHEET_NAME}' not found.` });
    }

    // Validate parameters
    const date = e.parameter.date;
    const product = e.parameter.product;
    const total = e.parameter.total;
    const soldQty = e.parameter.soldQty;

    if (!date || !product || !total || !soldQty) {
        return createJsonResponse({ success: false, error: 'Missing required sale parameters.' });
    }

    // Consider adding logic here to update the quantity in the 'منتجات' sheet as well
    // This requires finding the product row and updating column C.
    // It might be safer to do this update *before* appending the sale record.
    // Example (needs error handling and refinement):
    /*
    const productsSheet = ss.getSheetByName(PRODUCTS_SHEET_NAME);
    if (productsSheet) {
      const productNames = productsSheet.getRange('A4:A' + productsSheet.getLastRow()).getValues();
      let productRowIndex = -1;
      for (let i = 0; i < productNames.length; i++) {
        if (productNames[i][0] === product) {
          productRowIndex = i + 4; // +4 because data starts from row 4
          break;
        }
      }
      if (productRowIndex !== -1) {
        const qtyCell = productsSheet.getRange('C' + productRowIndex);
        const currentQty = parseInt(qtyCell.getValue()) || 0;
        const newQty = currentQty - parseInt(soldQty);
        if (newQty < 0) {
           return createJsonResponse({ success: false, error: 'Sale quantity exceeds available stock (checked server-side).' });
        }
        qtyCell.setValue(newQty);
      } else {
        // Product not found in the products sheet - handle error?
        Logger.log(`Product '${product}' not found in sheet '${PRODUCTS_SHEET_NAME}' during sale append.`);
      }
    }
    */

    // Append the sale row
    sheet.appendRow([date, product, total, soldQty]);

    // It's good practice to return the appended data or a confirmation
    return createJsonResponse({ success: true, message: 'Sale appended successfully.' });

  } catch (error) {
    Logger.log('Error appending sale: ' + error);
    return createJsonResponse({ success: false, error: 'Failed to append sale: ' + error.message });
  }
}

/**
 * Fetches sales data from the spreadsheet.
 * Reads columns: Date (A), Product (B), Total (C), Quantity Sold (D).
 */
function getSales() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SALES_SHEET_NAME);
     if (!sheet) {
      return createJsonResponse({ success: false, error: `Sheet '${SALES_SHEET_NAME}' not found.` });
    }
    // Get all sales data
    const range = sheet.getRange(SALES_DATA_RANGE + sheet.getLastRow());
    const values = range.getValues().filter(row => row[0]); // Filter out rows without a date

    const sales = values.map(row => ({
      date: row[0], // Keep original date format for now, parsing handled client-side if needed
      product: String(row[1]).trim(),
      total: parseFloat(row[2]) || 0,
      soldQty: parseInt(row[3]) || 0
    }));

    // Add filtering logic here based on startDate/endDate if parameters were passed

    return createJsonResponse({ success: true, data: sales });
  } catch (error) {
    Logger.log('Error fetching sales: ' + error);
    return createJsonResponse({ success: false, error: 'Failed to fetch sales: ' + error.message });
  }
}


/**
 * Helper function to create a JSON response for the web app.
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Optional: Add doPost function if you switch appendSale to use POST
/*
function doPost(e) {
  try {
    const action = e.parameter.action;
    if (action === 'appendSale') {
       // Assuming data is sent as JSON payload
       // const requestData = JSON.parse(e.postData.contents);
       // return appendSaleUsingData(requestData); // Need a modified appendSale
       // Or if using form data parameters:
       return appendSale(e); // Can reuse the GET version if parameters are sent similarly
    } else {
      return createJsonResponse({ success: false, error: 'Invalid POST action.' });
    }
  } catch (error) {
    Logger.log('Error in doPost: ' + error);
    return createJsonResponse({ success: false, error: 'An unexpected error occurred in POST: ' + error.message });
  }
}
*/

```
