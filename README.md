

#  Dealer Portal – Full Stack Application

A complete Dealer Management Portal featuring authentication (OTP login), role-based dashboards, orders, invoices, payments, pricing updates, materials, regions/territories, chat, notifications, and reporting.

---

##  Tech Stack

### **Frontend**

* React + Vite
* React Router
* Axios
* Material UI
* Recharts
* Socket.io Client
* Context API (Auth, Themes, Notifications)

### **Backend**

* Node.js + Express
* PostgreSQL + Sequelize ORM
* JWT Authentication
* Multer File Upload
* Nodemailer for OTP
* Socket.io
* PDF/Excel generation
* Helmet + Rate Limiting

---

#  Installation & Setup

## 1️⃣ Clone the Repository

```sh
git clone <your-repo-url>
cd dealer-portal
```

---

## 2️⃣ Backend Setup (`/backend`)

### Install dependencies

```sh
cd backend
npm install
```

### Configure environment

Copy `.env.example` → `.env`

```sh
cp .env.example .env
```

Update the values:

```
PORT=3000
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=dealer_portal
JWT_SECRET=your-secret
EMAIL_USER=your-email
EMAIL_PASSWORD=your-password
UPLOAD_PATH=./uploads
```

### Run DB migrations

```sh
npx sequelize-cli db:migrate
```

### Seed base data (roles, permissions, products, etc.)

```sh
node src/utils/seed.js
```

### Start backend server

```sh
npm run dev
```

Backend runs at: `http://localhost:3000`

---

## 3️⃣ Frontend Setup (`/frontend`)

### Install dependencies

```sh
cd frontend
npm install
```

### Start development server

```sh
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

# 🔐 Login Flow (2-Step OTP)

1. User enters **username + password**
2. Server validates & generates **OTP**
3. User enters OTP → receives **JWT token**
4. Role decides dashboard & permissions

---

# 🗂 Folder Structure (Simplified)

### **Backend**

```
backend/
 ├── src/
 │   ├── controllers/
 │   ├── middleware/
 │   ├── migrations/
 │   ├── models/
 │   ├── routes/
 │   ├── utils/
 │   └── server.js
 ├── uploads/
 ├── package.json
 └── .env
```

### **Frontend**

```
frontend/
 ├── src/
 │   ├── components/
 │   ├── context/
 │   ├── pages/
 │   ├── services/
 │   ├── utils/
 │   └── App.jsx
 ├── public/
 ├── index.html
 ├── package.json
 └── vite.config.js
```

---

# 🧩 Major Features

### ✔ Authentication & Roles

* OTP-based login
* JWT secure routes
* Role-based permission checks
* Roles: SuperAdmin, Technical Admin, Regional Admin, Dealer Admin, Dealer Staff, Manager, etc.

### ✔ Dealer & User Management

* Create/edit/delete users
* Assign roles & regions
* Verify dealers
* Block/unblock dealers

### ✔ Materials & Inventory

* Upload via Excel
* Material analytics
* Pricing requests & approvals

### ✔ Orders Module

* Order creation
* Approval flows
* Order tracking

### ✔ Invoice & Payments

* Invoice listing
* Credit/Debit notes
* Payment request creation
* Finance approval dashboard

### ✔ Reports

* Dealer performance
* Region/territory summary
* Outstanding receivables
* Admin KPIs (users, docs, pricing trends)

### ✔ Maps (Regions/Territories)

* Upload GeoJSON
* Territory assignments

### ✔ Real-time Chat

* Dealer ↔ Admin chat
* Socket.io notifications

---

# ⚙ API Base URL

Update inside `frontend/src/services/api.js`

```js
const api = axios.create({
  baseURL: "http://localhost:3000",
});
```

---

# ▶ Running Both Servers Together

Backend:

```sh
cd backend
npm run dev
```

Frontend:

```sh
cd frontend
npm run dev
```

---

# 🧪 Testing Credentials (Example)

```
username: admin
password: admin123
OTP: (sent via email or console)
```

---

# 📄 License

Private/Proprietary – for internal company use only.

---



