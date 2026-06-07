#pragma once
#include <stddef.h>

// Buffer circular de tamanho fixo (Vertente 2).
// Janela deslizante com indices head/tail; insercao e remocao em O(1).
template <typename T, size_t CAPACITY>
class RingBuffer {
public:
  RingBuffer() : head_(0), tail_(0), count_(0) {}

  bool push(const T &item) {
    if (isFull()) {
      tail_ = advance(tail_);
      count_--;
    }
    buffer_[head_] = item;
    head_ = advance(head_);
    count_++;
    return true;
  }

  bool pop(T &out) {
    if (isEmpty()) return false;
    out = buffer_[tail_];
    tail_ = advance(tail_);
    count_--;
    return true;
  }

  bool peek(size_t i, T &out) const {
    if (i >= count_) return false;
    out = buffer_[(tail_ + i) % CAPACITY];
    return true;
  }

  bool isEmpty() const { return count_ == 0; }
  bool isFull() const { return count_ == CAPACITY; }
  size_t size() const { return count_; }
  size_t capacity() const { return CAPACITY; }

private:
  size_t advance(size_t index) const { return (index + 1) % CAPACITY; }

  T buffer_[CAPACITY];
  size_t head_;
  size_t tail_;
  size_t count_;
};
