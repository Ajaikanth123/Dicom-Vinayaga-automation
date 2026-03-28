#!/bin/bash

# WhatsApp API Test Script
# New Account Credentials
# Phone Number ID: 1054890871033382
# WABA ID: 1225949859701511

# IMPORTANT: Replace YOUR_ACCESS_TOKEN with your actual token
ACCESS_TOKEN="YOUR_ACCESS_TOKEN_HERE"
PHONE_NUMBER_ID="1054890871033382"

echo "=========================================="
echo "WhatsApp Business API Test"
echo "=========================================="
echo ""

# Test 1: Send to +919443365797
echo "Test 1: Sending template to +919443365797"
echo "------------------------------------------"

curl -X POST \
  "https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "919443365797",
    "type": "template",
    "template": {
      "name": "doctor_scan_notification",
      "language": {
        "code": "en"
      },
      "components": [
        {
          "type": "body",
          "parameters": [
            {
              "type": "text",
              "text": "Kumar"
            },
            {
              "type": "text",
              "text": "Test Patient"
            },
            {
              "type": "text",
              "text": "CT Scan - Head"
            },
            {
              "type": "text",
              "text": "March 1, 2026"
            }
          ]
        }
      ]
    }
  }'

echo ""
echo ""
echo "=========================================="
echo ""

# Test 2: Send to +919080408814
echo "Test 2: Sending template to +919080408814"
echo "------------------------------------------"

curl -X POST \
  "https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "919080408814",
    "type": "template",
    "template": {
      "name": "doctor_scan_notification",
      "language": {
        "code": "en"
      },
      "components": [
        {
          "type": "body",
          "parameters": [
            {
              "type": "text",
              "text": "Kumar"
            },
            {
              "type": "text",
              "text": "Test Patient 2"
            },
            {
              "type": "text",
              "text": "MRI Scan - Brain"
            },
            {
              "type": "text",
              "text": "March 1, 2026"
            }
          ]
        }
      ]
    }
  }'

echo ""
echo ""
echo "=========================================="
echo "Tests Complete!"
echo "=========================================="
echo ""
echo "Check both phones for WhatsApp messages"
echo ""
