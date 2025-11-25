;; Response Checking and STX Operations Demo
;; This file demonstrates proper response checking patterns and STX operations

;; Try these autocompletion features:
;; 1. Type 'deposit-contract' and press Tab (complete deposit example)
;; 2. Type 'stx-transfer-try' and press Tab (STX transfer with try!)
;; 3. Type 'response-check' and press Tab (response checking pattern)
;; 4. Type 'default-to' and press Tab (default value pattern)
;; 5. Type 'multi-contract' and press Tab (external contract calls)

;; Error constants
(define-constant err-transfer-failed (err u100))
(define-constant err-insufficient-balance (err u101))
(define-constant err-invalid-amount (err u102))

;; Deposit contract example (from your text)
(define-map deposits principal uint)

(define-read-only (get-total-deposit (who principal))
  (default-to u0 (map-get? deposits who))
)

;; Correct implementation - STX transfer as last expression
(define-public (deposit (amount uint))
  (begin
    (map-set deposits tx-sender (+ (get-total-deposit tx-sender) amount))
    (stx-transfer? amount tx-sender (as-contract tx-sender))
  )
)

;; Alternative implementation with try! for response checking
(define-public (deposit-with-try (amount uint))
  (begin
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (map-set deposits tx-sender (+ (get-total-deposit tx-sender) amount))
    (ok true)
  )
)

;; Function that demonstrates intermediary response checking
(define-public (transfer-with-validation (to principal) (amount uint))
  (begin
    ;; Check if sender has enough balance
    (let ((sender-balance (stx-get-balance tx-sender)))
      (asserts! (>= sender-balance amount) err-insufficient-balance)
    )
    
    ;; Perform the transfer (this must be checked!)
    (try! (stx-transfer? amount tx-sender to))
    
    ;; Update our internal tracking
    (map-set deposits tx-sender (- (get-total-deposit tx-sender) amount))
    (map-set deposits to (+ (get-total-deposit to) amount))
    
    (ok true)
  )
)

;; Function demonstrating default-to pattern
(define-read-only (get-user-info (user principal))
  (let ((deposit-amount (map-get? deposits user)))
    {
      user: user,
      deposit: (default-to u0 deposit-amount),
      balance: (stx-get-balance user)
    }
  )
)

;; Function with multiple response checks
(define-public (complex-operation (recipient principal) (amount uint))
  (begin
    ;; First check: validate amount
    (asserts! (> amount u0) err-invalid-amount)
    
    ;; Second check: get current balance
    (let ((current-balance (stx-get-balance tx-sender)))
      (asserts! (>= current-balance amount) err-insufficient-balance)
    )
    
    ;; Third check: perform transfer (must be checked!)
    (try! (stx-transfer? amount tx-sender recipient))
    
    ;; Fourth check: update internal state
    (let ((new-deposit (+ (get-total-deposit recipient) amount)))
      (map-set deposits recipient new-deposit)
    )
    
    (ok true)
  )
)

;; Function demonstrating expects! pattern
(define-public (withdraw (amount uint))
  (let ((current-deposit (map-get? deposits tx-sender)))
    (let ((deposit-amount (expects! current-deposit err-insufficient-balance)))
      (asserts! (>= deposit-amount amount) err-insufficient-balance)
      
      (begin
        (map-set deposits tx-sender (- deposit-amount amount))
        (stx-transfer? amount (as-contract tx-sender) tx-sender)
      )
    )
  )
)

;; Function demonstrating error handling with external calls
(define-public (call-external-function (contract-address principal) (function-name string))
  (let ((result (contract-call? contract-address function-name)))
    (if (is-ok result)
      (ok (unwrap-err-panic result))
      (err u500)  ; External contract failed
    )
  )
)

;; Test the deposit function
(print (deposit u500))
(print (deposit-with-try u1000))
(print (transfer-with-validation tx-sender u100))
(print (get-user-info tx-sender))
