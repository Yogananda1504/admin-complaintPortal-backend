### Description of [`statsController`](command:_github.copilot.openSymbolFromReferences?%5B%22%22%2C%5B%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fd%3A%2Fcompliant-portal%2Fadmin-complaintPortal-backend%2Fcontrollers%2FstatsController.js%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A10%2C%22character%22%3A6%7D%7D%5D%2C%2295cdf664-34c8-4caf-adb9-cf94184f256f%22%5D "Go to definition")

**Purpose:**
Fetch and provide statistics related to hostel complaints.

**Inputs:**
- **Request ([`req`](command:_github.copilot.openSymbolFromReferences?%5B%22%22%2C%5B%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fd%3A%2Fcompliant-portal%2Fadmin-complaintPortal-backend%2Fcontrollers%2FstatsController.js%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A10%2C%22character%22%3A32%7D%7D%5D%2C%2295cdf664-34c8-4caf-adb9-cf94184f256f%22%5D "Go to definition")):** HTTP request object.
- **Response ([`res`](command:_github.copilot.openSymbolFromReferences?%5B%22%22%2C%5B%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fd%3A%2Fcompliant-portal%2Fadmin-complaintPortal-backend%2Fcontrollers%2FstatsController.js%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A10%2C%22character%22%3A36%7D%7D%5D%2C%2295cdf664-34c8-4caf-adb9-cf94184f256f%22%5D "Go to definition")):** HTTP response object.
- **Next ([`next`](command:_github.copilot.openSymbolFromReferences?%5B%22%22%2C%5B%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fd%3A%2Fcompliant-portal%2Fadmin-complaintPortal-backend%2Fcontrollers%2FstatsController.js%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A10%2C%22character%22%3A40%7D%7D%5D%2C%2295cdf664-34c8-4caf-adb9-cf94184f256f%22%5D "Go to definition")):** Middleware function for error handling.

**Process:**
1. Retrieve all complaints from the database using [`Complaints.find()`](command:_github.copilot.openSymbolFromReferences?%5B%22%22%2C%5B%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fd%3A%2Fcompliant-portal%2Fadmin-complaintPortal-backend%2Fcontrollers%2FstatsController.js%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A7%2C%22character%22%3A7%7D%7D%5D%2C%2295cdf664-34c8-4caf-adb9-cf94184f256f%22%5D "Go to definition").
2. Calculate the following statistics:
   - **Total Complaints ([`totalComplaints`](command:_github.copilot.openSymbolFromReferences?%5B%22%22%2C%5B%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fd%3A%2Fcompliant-portal%2Fadmin-complaintPortal-backend%2Fcontrollers%2FstatsController.js%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A13%2C%22character%22%3A14%7D%7D%5D%2C%2295cdf664-34c8-4caf-adb9-cf94184f256f%22%5D "Go to definition")):** Total number of complaints.
   - **Resolved Complaints ([`resolvedComplaints`](command:_github.copilot.openSymbolFromReferences?%5B%22%22%2C%5B%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fd%3A%2Fcompliant-portal%2Fadmin-complaintPortal-backend%2Fcontrollers%2FstatsController.js%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A14%2C%22character%22%3A14%7D%7D%5D%2C%2295cdf664-34c8-4caf-adb9-cf94184f256f%22%5D "Go to definition")):** Number of complaints with status "Resolved".
   - **Unresolved Complaints ([`unresolvedComplaints`](command:_github.copilot.openSymbolFromReferences?%5B%22%22%2C%5B%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fd%3A%2Fcompliant-portal%2Fadmin-complaintPortal-backend%2Fcontrollers%2FstatsController.js%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A15%2C%22character%22%3A14%7D%7D%5D%2C%2295cdf664-34c8-4caf-adb9-cf94184f256f%22%5D "Go to definition")):** Number of complaints with status "Pending".
   - **Viewed Complaints ([`viewedComplaints`](command:_github.copilot.openSymbolFromReferences?%5B%22%22%2C%5B%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fd%3A%2Fcompliant-portal%2Fadmin-complaintPortal-backend%2Fcontrollers%2FstatsController.js%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A16%2C%22character%22%3A14%7D%7D%5D%2C%2295cdf664-34c8-4caf-adb9-cf94184f256f%22%5D "Go to definition")):** Number of complaints with read status "Viewed".
   - **Not Viewed Complaints ([`notViewedComplaints`](command:_github.copilot.openSymbolFromReferences?%5B%22%22%2C%5B%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fd%3A%2Fcompliant-portal%2Fadmin-complaintPortal-backend%2Fcontrollers%2FstatsController.js%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A17%2C%22character%22%3A14%7D%7D%5D%2C%2295cdf664-34c8-4caf-adb9-cf94184f256f%22%5D "Go to definition")):** Number of complaints with read status "Not viewed".
3. Send a JSON response with the calculated statistics.
4. Handle any errors by logging them and passing an error message to the next middleware.

**Outputs:**
- **Success (HTTP 200):**
  ```json
  {
    "success": true,
    "totalComplaints": <number>,
    "resolvedComplaints": <number>,
    "unresolvedComplaints": <number>,
    "viewedComplaints": <number>,
    "notViewedComplaints": <number>
  }
  ```
- **Error:**
  - Passes an error to the next middleware with the message "Error in fetching stats" and a status code of 500.

**Usage:**
This controller can be used by the frontend to display various statistics about hostel complaints, such as the number of total, resolved, unresolved, viewed, and not viewed complaints.