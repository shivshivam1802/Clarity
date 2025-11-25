;; Unwrapping and Error Handling Demo
;; This file demonstrates Clarity's unwrapping functions and error handling

;; Try these autocompletion features:
;; 1. Type 'try' and press Tab (try! function)
;; 2. Type 'unwrap' and press Tab (unwrap! function)
;; 3. Type 'try-example' and press Tab (complete example)
;; 4. Type 'check-response' and press Tab (response checking pattern)

;; Basic try! function example
(define-public (try-example (input (response uint uint)))
  (begin
    (try! input)
    (ok "end of the function")
  )
)

;; Test the try! function
(print (try-example (ok u1)))  ; Returns (ok "end of the function")
(print (try-example (err u2))) ; Returns (err u2) - original error propagated

;; Working with optionals
(define-map user-balances principal uint)

;; Function that safely gets a balance
(define-public (get-balance (user principal))
  (let ((balance (map-get? user-balances user)))
    (if (is-some balance)
      (ok (unwrap-panic balance))
      (err u404)  ; User not found
    )
  )
)

;; Function using try! for cleaner error propagation
(define-public (transfer-balance (from principal) (to principal) (amount uint))
  (let ((from-balance (try! (get-balance from))))
    (if (>= from-balance amount)
      (begin
        (map-set user-balances from (- from-balance amount))
        (map-set user-balances to (+ (try! (get-balance to)) amount))
        (ok true)
      )
      (err u100)  ; Insufficient balance
    )
  )
)

;; Function with multiple unwrapping patterns
(define-public (complex-operation (user principal) (amount uint))
  (let ((balance-optional (map-get? user-balances user)))
    (if (is-some balance-optional)
      (let ((balance (unwrap-panic balance-optional)))
        (if (>= balance amount)
          (ok (begin
            (map-set user-balances user (- balance amount))
            (print (concat "Transferred " (int-to-str amount)))
            true
          ))
          (err u100)  ; Insufficient balance
        )
      )
      (err u404)  ; User not found
    )
  )
)

;; Function using unwrap! with custom error
(define-public (safe-get-balance (user principal))
  (let ((balance (map-get? user-balances user)))
    (unwrap! balance (err u404))  ; Return custom error if none
  )
)

;; Function demonstrating different unwrapping strategies
(define-public (unwrapping-strategies (input (optional uint)))
  (begin
    ;; Strategy 1: try! - exits on none/err
    (try! input)
    
    ;; Strategy 2: unwrap! - returns custom value on none
    (let ((value1 (unwrap! input u0)))
      (print (int-to-str value1))
    )
    
    ;; Strategy 3: unwrap-panic - panics on none
    (let ((value2 (unwrap-panic input)))
      (print (int-to-str value2))
    )
    
    (ok true)
  )
)

;; Error handling with response types
(define-public (response-handling (input (response string uint)))
  (begin
    ;; Check if response is ok
    (if (is-ok input)
      (begin
        (print "Operation was successful")
        (unwrap-err-panic input)  ; Get the success value
      )
      (begin
        (print "Operation failed")
        (unwrap-err-panic input)  ; This will panic since it's an error
      )
    )
  )
)
