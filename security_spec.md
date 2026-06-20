# Security Specification: Learn 2 Future

## 1. Data Invariants and Access Control Model

| Collection | Create Rule | Read Rule | Update Rule | Delete Rule |
|---|---|---|---|---|
| `/courses` | `isAdmin()` | Public (Anyone) | `isAdmin()` | `isAdmin()` |
| `/orders` | `isSignedIn()` | `isOwner()` OR `isAdmin()` | `isAdmin()` | `isAdmin()` |
| `/contactMessages` | Public (Anyone) | `isAdmin()` | `isAdmin()` | `isAdmin()` |
| `/admins` | `isAdmin()` | `isSignedIn()` | `isAdmin()` | `isAdmin()` |
| `/blogs` | `isAdmin()` | Public (Anyone) | `isAdmin()` | `isAdmin()` |
| `/student_portfolios` | `isOwner()` OR `isAdmin()` | Public (Anyone) | `isOwner()` OR `isAdmin()` | `isOwner()` OR `isAdmin()` |
| `/student_portfolios/{uid}/cheers` | `isSignedIn()` | Public (Anyone) | `isAdmin()` | `isAdmin()` |

### Key Definitions:
* `isSignedIn()`: `request.auth != null && request.auth.token.email_verified == true`
* `isAdmin()`: `isSignedIn() && (request.auth.token.email == "digitalcoursesbay@gmail.com" || exists(/databases/$(database)/documents/admins/$(request.auth.uid)))`
* `isOwner()`: `isSignedIn() && resource.data.email == request.auth.token.email`

---

## 2. The "Dirty Dozen" Threat Payloads (Security Test Scenarios)

1. **Anonymous Course Creation**: An unauthenticated user attempts to create a new course document.
2. **Standard User Course Creation**: A signed-in non-admin user attempts to insert a course with full details.
3. **Admin Email Spoofing**: A non-verified sign-in trying to claim `digitalcoursesbay@gmail.com` without verification (`email_verified == false`) and altering a course.
4. **Order Identity Spoofing**: A signed-in user creating an order where the owner details (email or userId) do not match their actual auth credentials.
5. **Direct Status Shortcutting**: A buyer creating an order and setting `status = "Verified"` or `"Delivered"` directly.
6. **Order Stealing (PII Leak)**: A user trying to fetch (`get`) another user's order details by guessing the order ID.
7. **Contact Message Scraping**: A malicious user trying to read / list all contact messages sent to the admin.
8. **Malicious ID Poisoning**: A user injecting a 1.5MB path variable string to trigger Denial-of-Wallet index exhaustion.
9. **Contact Form Spam Flooding**: Creating a contact message where `message` is a 5MB payload (must fail due to size limits <= 5000 chars).
10. **State Mutation of Admin Settings**: A standard user attempting to create or modify their own status inside the `admins` collection.
11. **Immortal Timestamp Tampering**: Attempting to alter a course's `createdAt` timestamp during an update or an order's `createdAt` time.
12. **Self-Promotion to Admin state**: A standard user updating their auth-associated email in the DB or changing order status after it is locked.
