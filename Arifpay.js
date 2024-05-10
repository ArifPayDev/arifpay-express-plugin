require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const BASE_URL = process.env.Base_url || "http://getway.arifpay.net/api";
const MakePayment_url = process.env.Create_checkout_path || "checkout/session";

class ArifPay {
  constructor(API_key, expireDate) {
    this.API_key = API_key;
    this.expireDate = expireDate;
    this.requiredFields = [
      "cancelUrl",
      "successUrl",
      "errorUrl",
      "notifyUrl",
      "paymentMethods",
      "items",
    ];
  }

  validatePaymentInfo(payment_info) {
    const beneficiariesAmount = payment_info.items.reduce((total, item) => {
      item.quantity = Number(item.quantity);
      item.price = Number(item.price);
      return total + item.quantity * item.price;
    }, 0);

    if (!payment_info.hasOwnProperty("beneficiaries")) {
      payment_info.beneficiaries = [
        {
          accountNumber: "01320811436100",
          bank: "AWINETAA",
          amount: beneficiariesAmount,
        },
      ];
    }

    return new Promise((resolve, reject) => {
      const missingFields = this.requiredFields.filter(
        (field) => !payment_info.hasOwnProperty(field)
      );

      if (missingFields.length > 0) {
        reject(
          new Error(
            `The following required fields are missing from payment_info: ${missingFields.join(
              ", "
            )}`
          )
        );
      } else {
        resolve("All required fields are present.");
      }
    });
  }

  async makePayment(payment_info) {
    try {
      await this.validatePaymentInfo(payment_info);
      payment_info.nonce = uuidv4();
      payment_info.expireDate = this.expireDate;
      const url = `${BASE_URL}${MakePayment_url}`;
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-arifpay-key": this.API_key,
        },
        body: JSON.stringify(payment_info),
      };
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(error);
      return error.message;
    }
  }
}

module.exports = ArifPay;
