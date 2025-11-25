;; Advanced Clarity Patterns Demo
;; This file demonstrates tuple maps, error handling, and complex data structures

;; Try these autocompletion features:
;; 1. Type 'listing-example' and press Tab (complete example)
;; 2. Type 'tuple-map' and press Tab (tuple map definition)
;; 3. Type 'err-constants' and press Tab (error constants)
;; 4. Type 'update-tuple' and press Tab (tuple update pattern)
;; 5. Type 'merge' and press Tab (merge tuples)
;; 6. Type 'get' and press Tab (get tuple field)

;; Some error constants
(define-constant err-unknown-listing (err u100))
(define-constant err-not-the-maker (err u101))
(define-constant err-insufficient-balance (err u102))
(define-constant err-invalid-amount (err u103))

;; Define an example map called listings, identified by a uint
(define-map listings
  {id: uint}
  {name: (string-ascii 50), maker: principal}
)

;; Insert some sample data
(map-set listings {id: u1} {name: "First Listing", maker: tx-sender})
(map-set listings {id: u2} {name: "Second Listing", maker: tx-sender})

;; Simple function to get a listing
(define-read-only (get-listing (id uint))
  (map-get? listings {id: id})
)

;; Update name function that only the maker for a specific listing can call
(define-public (update-name (id uint) (new-name (string-ascii 50)))
  (let
    (
      ;; The magic happens here
      (listing (unwrap! (get-listing id) err-unknown-listing))
    )
    (asserts! (is-eq tx-sender (get maker listing)) err-not-the-maker)
    (map-set listings {id: id} (merge listing {name: new-name}))
    (ok true)
  )
)

;; Two test calls
(print (update-name u1 "New name!"))
(print (update-name u9999 "Nonexistent listing..."))

;; More complex example with multiple fields
(define-map user-profiles
  {user: principal}
  {name: (string-ascii 50), email: (string-ascii 100), balance: uint, active: bool}
)

;; Function to update user profile
(define-public (update-user-profile 
  (user principal) 
  (new-name (string-ascii 50)) 
  (new-email (string-ascii 100))
)
  (let ((profile (unwrap! (map-get? user-profiles {user: user}) err-unknown-listing)))
    (asserts! (is-eq tx-sender user) err-not-the-maker)
    (map-set user-profiles {user: user} 
      (merge profile {name: new-name, email: new-email}))
    (ok true)
  )
)

;; Function to transfer balance between users
(define-public (transfer-balance (from principal) (to principal) (amount uint))
  (let (
    (from-profile (unwrap! (map-get? user-profiles {user: from}) err-unknown-listing))
    (to-profile (unwrap! (map-get? user-profiles {user: to}) err-unknown-listing))
  )
    (asserts! (is-eq tx-sender from) err-not-the-maker)
    (asserts! (>= (get balance from-profile) amount) err-insufficient-balance)
    (asserts! (> amount u0) err-invalid-amount)
    
    (map-set user-profiles {user: from} 
      (merge from-profile {balance: (- (get balance from-profile) amount)}))
    (map-set user-profiles {user: to} 
      (merge to-profile {balance: (+ (get balance to-profile) amount)}))
    
    (ok true)
  )
)

;; Function to get user balance
(define-read-only (get-balance (user principal))
  (let ((profile (map-get? user-profiles {user: user})))
    (if (is-some profile)
      (ok (get balance (unwrap-panic profile)))
      (err err-unknown-listing)
    )
  )
)

;; Function demonstrating complex tuple operations
(define-public (create-listing (id uint) (name (string-ascii 50)) (price uint))
  (let ((existing-listing (map-get? listings {id: id})))
    (if (is-none existing-listing)
      (begin
        (map-insert listings {id: id} {name: name, maker: tx-sender})
        (ok true)
      )
      (err u104)  ; Listing already exists
    )
  )
)

;; Function to update listing price (if we had a price field)
(define-public (update-listing-price (id uint) (new-price uint))
  (let ((listing (unwrap! (get-listing id) err-unknown-listing)))
    (asserts! (is-eq tx-sender (get maker listing)) err-not-the-maker)
    ;; Note: This would require adding a price field to the tuple
    ;; (map-set listings {id: id} (merge listing {price: new-price}))
    (ok true)
  )
)
