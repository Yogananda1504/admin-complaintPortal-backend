Input:
## Query Parameters

- **startDate**: The beginning date to fetch complaints (default is the Unix Epoch start if not provided).
- **endDate**: The ending date to fetch complaints (default is the current date if not provided).
- **lastSeenDate**: The date of the last seen complaint for pagination purposes.
- **lastSeenId**: The ID of the last seen complaint for pagination purposes.

## Output

JSON Response with:

- **complaints**: An array of complaint objects sorted by date and ID in ascending order.
- **pagination**: Information for the next page:
    - **nextLastSeenDate**: The date of the last complaint in the current response.
    - **nextLastSeenId**: The ID of the last complaint in the current response.

The endpoint is limited to returning 15 complaints per request. Make sure the dates are in a valid format when calling this endpoint, and ensure `startDate` is before `endDate`.