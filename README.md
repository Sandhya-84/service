1. Project Title

Support Renewal Tracker

Short description:

A MERN-based internal service management system for importing networking-unit data from Excel, tracking purchase orders and support expiry dates, managing renewals, and maintaining historical records.

2. Features
Excel workbook upload
Automatic processing of multiple Excel sheets
Customer management
Purchase Order management
Network unit management
Support expiry tracking
Renewal tracking
Historical data preservation
Dashboard with statistics and expiry status
Search and filtering
Customer → PO → Unit hierarchy
Manual customer/PO/unit creation
Flexible handling of different Excel columns
Additional fields for sheet-specific data
Comcast + CMIN data union
Juniper multi-section Excel handling
EVAL/Demos data extraction from the same Excel upload
Import history
Authentication/protected pages
Responsive dashboard
Dark/light UI if currently implemented
3. Technology Stack

Frontend

React
Vite
React Router
Axios
CSS/Tailwind — mention whichever your current frontend actually uses

Backend

Node.js
Express.js
MongoDB
Mongoose
Multer
XLSX
Zod — if currently used
JWT
bcryptjs
node-cron — if currently used
Nodemailer — if currently used
4. System Architecture

Explain:

Excel Workbook
      ↓
Excel Import API
      ↓
Excel Import Service
      ↓
 ┌────┴───────────────┐
 ↓                    ↓
Normal Sheets        Demos Sheet
 ↓                    ↓
Customer             EVAL Values
 ↓                    ↓
Purchase Order       EVAL Page
 ↓
Network Units
 ↓
Dashboard
5. Project Structure

Example:

service/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── server.js
│   │
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── .env
│
└── README.md

Adjust this to your actual folders rather than adding folders that don't exist.

6. Database Models

Document the main collections:

Customer
name
additionalFields
createdAt
updatedAt
PurchaseOrder
customerId
poNumber
invoiceNumber
supportExpiryDate
nextRenewalDate
team
notes
renewed
additionalFields
createdAt
updatedAt
NetworkUnit
customerId
purchaseOrderId
unitCode
hostname
radioConfiguration
additionalFields
createdAt
updatedAt
Import
fileName
importedAt
totalCustomers
totalPurchaseOrders
totalUnits
sheetResults
status
errorMessage
EvalValue
unit
hostname
radioConfig
shipmentDate
customer
createdAt
updatedAt
7. Excel Import Logic

This is an important section for your project.

Explain that the application can process different sheet structures instead of requiring every sheet to have exactly the same columns.

For example:

Standard fields
→ Unit
→ Hostname
→ Radio Configuration
→ PO Details
→ Invoice Number
→ Support Expiry Date

Additional columns are stored inside:

additionalFields

Examples:

Location
Team
Reseller
Previous expiry
Replaced system
ASA Number
8. Special Excel Handling

Mention the special cases you implemented:

Comcast + CMIN

Comcast sheet ─┐
               ├──→ Comcast customer
CMIN sheet ────┘

Their data is combined under the same customer.

Juniper

The Juniper sheet contains multiple header/data sections and is processed separately.

Demos

The Demos sheet is not treated as a normal customer sheet.

Instead:

Main Excel Upload
       ↓
Demos Sheet
       ↓
EvalValue collection
       ↓
EVAL Units page

There is no separate EVAL Excel upload.

9. Data Preservation / Duplicate Handling

Explain your important uniqueness rules:

Purchase Order

Customer + PO Number

Network Unit

Customer + PO + Unit Code + Hostname

This allows the same unit to exist under different POs when it represents different historical records.

10. Dashboard

Describe the dashboard:

Total customers
Total purchase orders
Total network units
Active POs
Expiring POs
Expired POs
POs without expiry dates
Status visualization
Search
Filters
Expand/collapse PO details
Renewal updates
11. Pages

Document the application pages:

Login
Register
Dashboard
Recent Activity
Import Excel
Import History
Add Customer
Add Purchase Order
Add Network Unit
EVAL Units
12. API Endpoints

Document your actual endpoints, for example:

POST   /api/import/excel
GET    /api/import/history

GET    /api/dashboard/summary
GET    /api/dashboard/status
GET    /api/dashboard/data

GET    /api/eval-values
GET    /api/eval-values/summary

POST   /api/customers
POST   /api/purchase-orders
PUT    /api/purchase-orders/:id

POST   /api/renewal-history
GET    /api/renewal-history

Only include endpoints that actually exist in your backend.

13. Environment Variables

Example:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173

Frontend:

VITE_API_URL=http://localhost:5000/api

Again, match these with your actual .env usage.

14. Installation
git clone <repository-url>
cd service

Backend:

cd backend
npm install
npm run dev

Frontend:

cd frontend
npm install
npm run dev
15. How to Use

A simple workflow:

1. Login
2. Open Import Excel
3. Upload the main Excel workbook
4. System processes all supported sheets
5. Customers, POs and units are stored
6. Demos data is extracted automatically
7. Open Dashboard
8. Search/filter units and POs
9. Update renewal information
10. View EVAL Units separately
11. View Import History
16. Important Excel Requirements

Explain what the importer expects and that column names can vary.

For example:

Unit / Unit Code / UnitCode
Hostname / Host Name
Radio Configuration / Radio Config / Radios
PO-Details / PO Details / PO
Invoice Number / Invoice No / ASA Number
Support Expiry Date / Expiry Date

This is useful because your workbook has different column names across sheets.

17. Error Handling

Mention:

Invalid/no Excel file
Unsupported/missing data
Database errors
Failed imports recorded in Import History
Authentication errors
Validation errors


Sandhya Kuppili

B.Tech – Information Technology
ANITS

For your project specifically, the most important README sections are: Features → Architecture → Excel Import Logic → Database Models → Special Excel Handling → Duplicate/History Handling → API Endpoints → Setup → Usage. These explain what makes your project different from a basic CRUD MERN application.
