#pragma once
#include <stddef.h>

/**
 * Vertente 2 — Buffer Circular (Ring Buffer) de tamanho fixo.
 *
 * Janela deslizante de telemetria implementada com dois índices (head/tail)
 * e um contador. Todas as operações são O(1): a inserção e a remoção apenas
 * avançam índices em aritmética modular, SEM mover elementos em massa
 * (sem memmove/memcpy/realloc). A memória é alocada uma única vez (estática),
 * portanto não há fragmentação de heap nem jitter dependente de N.
 *
 * @tparam T         tipo da amostra armazenada
 * @tparam CAPACITY  tamanho fixo da janela (em nº de amostras)
 */
template <typename T, size_t CAPACITY>
class RingBuffer {
public:
  RingBuffer() : head_(0), tail_(0), count_(0) {}

  /**
   * Insere uma amostra em tempo constante O(1).
   * Se a janela está cheia, sobrescreve a amostra mais antiga (comportamento
   * de janela deslizante), apenas avançando o índice tail — nada é deslocado.
   */
  bool push(const T &item) {
    if (isFull()) {
      tail_ = advance(tail_); // descarta a mais antiga em O(1)
      count_--;
    }
    buffer_[head_] = item;
    head_ = advance(head_);
    count_++;
    return true;
  }

  /** Remove a amostra mais antiga em tempo constante O(1). */
  bool pop(T &out) {
    if (isEmpty()) {
      return false;
    }
    out = buffer_[tail_];
    tail_ = advance(tail_);
    count_--;
    return true;
  }

  /** Lê sem remover a i-ésima amostra mais antiga (0 = mais antiga). O(1). */
  bool peek(size_t i, T &out) const {
    if (i >= count_) {
      return false;
    }
    out = buffer_[(tail_ + i) % CAPACITY];
    return true;
  }

  bool isEmpty() const { return count_ == 0; }
  bool isFull() const { return count_ == CAPACITY; }
  size_t size() const { return count_; }
  size_t capacity() const { return CAPACITY; }

private:
  size_t advance(size_t index) const { return (index + 1) % CAPACITY; }

  T buffer_[CAPACITY]; // memória estática — alocada uma única vez
  size_t head_;        // próxima posição de escrita
  size_t tail_;        // posição da amostra mais antiga
  size_t count_;       // nº de amostras atualmente na janela
};
