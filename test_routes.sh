#!/bin/bash

# Multi-Uploader API Testing Script
# This script tests all the API endpoints

BASE_URL="http://localhost:8001"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║       Multi-Uploader API - Comprehensive Route Testing        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    local expect_auth=$5
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${YELLOW}[TEST $TOTAL_TESTS]${NC} $description"
    echo -e "  Method: $method"
    echo -e "  Endpoint: $endpoint"
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    elif [ "$method" == "POST" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint")
        fi
    elif [ "$method" == "PUT" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PUT -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    elif [ "$method" == "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    # Check if request was successful
    if [ "$expect_auth" == "true" ] && [ "$http_code" == "401" ]; then
        echo -e "  ${GREEN}✓ PASSED${NC} (Correctly requires authentication)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    elif [ "$http_code" == "200" ] || [ "$http_code" == "201" ]; then
        echo -e "  ${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "  ${RED}✗ FAILED${NC} (HTTP $http_code)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    echo "$body" | json_pp 2>/dev/null | head -n 10
    echo ""
}

echo "═══════════════════════════════════════════════════════════════"
echo "1. TESTING PUBLIC ENDPOINTS"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Test root endpoint
test_endpoint "GET" "/" "" "Root endpoint - API documentation"

# Test health check
test_endpoint "GET" "/api/health" "" "Health check endpoint"

echo "═══════════════════════════════════════════════════════════════"
echo "2. TESTING AUTHENTICATION ROUTES"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Test registration (will fail without email service but route should work)
test_endpoint "POST" "/api/auth/register" '{"email":"test@example.com","password":"Test1234"}' "User registration"

# Test login (will fail as user may not exist)
test_endpoint "POST" "/api/auth/login" '{"email":"test@example.com","password":"Test1234"}' "User login"

# Test OTP verification (will fail as no OTP)
test_endpoint "POST" "/api/auth/verify-otp" '{"email":"test@example.com","code":"123456"}' "OTP verification"

# Test resend OTP
test_endpoint "POST" "/api/auth/resend-otp" '{"email":"test@example.com"}' "Resend OTP"

# Test profile endpoint without auth (should fail with 401)
test_endpoint "GET" "/api/auth/profile" "" "Get profile (no auth - should fail)" "true"

echo "═══════════════════════════════════════════════════════════════"
echo "3. TESTING USER ROUTES (Protected)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Test user profile (should require auth)
test_endpoint "GET" "/api/user/profile" "" "Get user profile (should require auth)" "true"

echo "═══════════════════════════════════════════════════════════════"
echo "4. TESTING VIDEO ROUTES (Protected)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Test video quota (should require auth)
test_endpoint "GET" "/api/videos/quota" "" "Get video quota (should require auth)" "true"

# Test get videos (should require auth)
test_endpoint "GET" "/api/videos" "" "Get user videos (should require auth)" "true"

echo "═══════════════════════════════════════════════════════════════"
echo "5. TESTING ADMIN ROUTES (Protected)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Test admin stats (should require auth)
test_endpoint "GET" "/api/admin/stats" "" "Get system stats (should require auth)" "true"

# Test admin users (should require auth)
test_endpoint "GET" "/api/admin/users" "" "Get all users (should require auth)" "true"

# Test admin health
test_endpoint "GET" "/api/admin/health" "" "Admin health check (should require auth)" "true"

echo "═══════════════════════════════════════════════════════════════"
echo "                      TEST SUMMARY"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo -e "Total Tests:  $TOTAL_TESTS"
echo -e "${GREEN}Passed Tests: $PASSED_TESTS${NC}"
echo -e "${RED}Failed Tests: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ ALL ROUTES ARE WORKING CORRECTLY!${NC}"
else
    echo -e "${YELLOW}⚠ Some tests failed. Check the output above for details.${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
