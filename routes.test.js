process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("./app");
const db = require("./db");

let testCustomer;
let testReservation;

beforeEach(async function () {
  let resultCustomer = await db.query(`INSERT INTO 
        customers (first_name, last_name, phone, notes)
        VALUES ('TestFirstName', 'TestLastName', '111 222 222', 'This is a test note') RETURNING id, first_name, last_name, phone, notes`);
  testCustomer = resultCustomer.rows[0]

  let resultReservation = await db.query(`INSERT INTO reservations (customer_id, num_guests, start_at, notes)
    VALUES (${testCustomer.id}, 10000, current_timestamp, 'This is a note for a test reservation') RETURNING customer_id, num_guests, start_at, notes`);
  testReservation = resultReservation.rows[0]
})

describe("GET /", function () {
  test("Get a list of all customers", async function () {
    const response = await request(app).get(`/`);
    expect(response.statusCode).toEqual(200);
    expect(response.text).toEqual(expect.stringContaining(testCustomer.first_name))
  });

  //need test for search
})

/** Test our GET /add route */

describe("GET /add/", function () {
  test("Show add new customer form", async function() {
    const response = await request(app).get(`/add/`);

    expect(response.statusCode).toEqual(200);
    expect(response.text).toEqual(expect.stringContaining('<form action="/add/" method="POST">'));
  });
});

/** Test our POST /add route to make a new customer */

describe("POST /add/", function() {
  test("Add new customer to database and redirect to customer details", async function() {
    const data = {
      firstName: "NewTestFirst",
      lastName: "NewTestLast",
      phone: "999",
      notes: "New customer",
    }

    const response = await request(app)
      .post(`/add/`)
      .type("form")
      .send(data);
    
    const result = await db.query(`
      SELECT id FROM customers WHERE first_name = '${data.firstName}'`);

    let newCustomer = result.rows[0];

    expect(response.statusCode).toEqual(302);
    expect(response.header["location"]).toEqual(`/${newCustomer.id}/`);
  })
})


afterEach(async function () {
  // delete any data created by test
  await db.query("DELETE FROM reservations");
  await db.query("DELETE FROM customers");

});

afterAll(async function () {
  // close db connection
  await db.end();
});