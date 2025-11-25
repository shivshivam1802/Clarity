;; Map Operations Demo
;; This file demonstrates comprehensive map operations in Clarity

;; Try these autocompletion features:
;; 1. Type 'map-example' and press Tab (complete example)
;; 2. Type 'map-tuple' and press Tab (map with tuple values)
;; 3. Type 'map-insert' and press Tab (insert operation)
;; 4. Type 'map-set' and press Tab (set operation)
;; 5. Type 'map-get' and press Tab (get operation)
;; 6. Type 'map-delete' and press Tab (delete operation)

;; Simple map example
(define-map scores principal uint)

;; Insert a value (fails if key already exists)
(map-insert scores tx-sender u100)

;; This second insert will fail because the key already exists
;; (map-insert scores tx-sender u200)  ; This would fail

;; Set a value (overwrites existing)
(map-set scores tx-sender u200)

;; Get the score for tx-sender
(print (map-get? scores tx-sender))

;; Delete the entry for tx-sender
(map-delete scores tx-sender)

;; Will return none because the entry got deleted
(print (map-get? scores tx-sender))

;; Map with tuple values (like the orders example)
(define-map orders uint {maker: principal, amount: uint})

;; Set two orders
(map-set orders u0 {maker: tx-sender, amount: u50})
(map-set orders u1 {maker: tx-sender, amount: u120})

;; Retrieve order with ID u1
(print (map-get? orders u1))

;; Example function that uses map operations
(define-public (update-score (player principal) (new-score uint))
  (begin
    ;; Check if player already has a score
    (let ((existing-score (map-get? scores player)))
      (if (is-some existing-score)
        ;; Player exists, update their score
        (begin
          (map-set scores player new-score)
          (ok (print (concat "Updated score for " (unwrap-panic existing-score))))
        )
        ;; New player, insert their score
        (begin
          (map-insert scores player new-score)
          (ok (print (concat "New player added with score " (int-to-str new-score))))
        )
      )
    )
  )
)

;; Example function that safely gets a map value
(define-read-only (get-player-score (player principal))
  (let ((score (map-get? scores player)))
    (if (is-some score)
      (ok (unwrap-panic score))
      (err u404)  ; Player not found
    )
  )
)
