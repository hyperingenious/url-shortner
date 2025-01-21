# Get Overall Analytics API

### **Endpoint**  
`/api/analytics/overall`

### **Method**  
`GET`

### **Description**  
Retrieve overall analytics for all short URLs created by the authenticated user, providing a comprehensive view of their link performance.

### **Response**  
- **`totalUrls` (number)**: Total number of short URLs created by the user.  
- **`totalClicks` (number)**: Total number of clicks across all URLs created by the user.  
- **`uniqueUsers` (number)**: Total number of unique users who accessed any of the user's short URLs.  
- **`clicksByDate` (array)**: An array of objects containing:  
  - `date` (string): The date.  
  - `totalClicks` (number): Total click counts for all URLs on that date.  

#### **`osType` (array)**  
An array of objects containing:  
- **`osName` (string)**: The name of the operating system (e.g., Windows, macOS, Linux, iOS, Android).  
- **`uniqueClicks` (number)**: Number of unique clicks for that OS.  
- **`uniqueUsers` (number)**: Number of unique users for that OS.  

#### **`deviceType` (array)**  
An array of objects containing:  
- **`deviceName` (string)**: The type of device used (e.g., mobile, desktop).  
- **`uniqueClicks` (number)**: Number of unique clicks for that device type.  
- **`uniqueUsers` (number)**: Number of unique users for that device type.  
