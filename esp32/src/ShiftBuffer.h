#pragma once
#include <stddef.h>
#include <stdlib.h>

// Vertente 1 (anti-padrao). Duas variantes para comparacao:
//   ShiftBuffer   -> janela fixa mantida por deslocamento de elementos (O(n)).
//   GrowingBuffer -> historico que cresce via realloc a cada leitura (O(n)).

template <typename T>
class ShiftBuffer {
public:
  explicit ShiftBuffer(size_t window) : window_(window), size_(0) {
    data_ = (T *)malloc(sizeof(T) * window_);
  }

  ~ShiftBuffer() { free(data_); }

  void push(const T &item) {
    if (size_ < window_) {
      data_[size_++] = item;
      return;
    }
    // janela cheia: desloca todos uma posicao e descarta o mais antigo
    for (size_t i = 1; i < window_; i++) {
      data_[i - 1] = data_[i];
    }
    data_[window_ - 1] = item;
  }

  size_t size() const { return size_; }
  size_t capacity() const { return window_; }
  bool get(size_t i, T &out) const {
    if (i >= size_) return false;
    out = data_[i];
    return true;
  }

private:
  size_t window_;
  size_t size_;
  T *data_;
};

template <typename T>
class GrowingBuffer {
public:
  GrowingBuffer() : size_(0), data_(nullptr) {}

  ~GrowingBuffer() { free(data_); }

  void push(const T &item) {
    // realloc copia todo o conteudo anterior -> O(n) por insercao
    T *grown = (T *)realloc(data_, sizeof(T) * (size_ + 1));
    if (grown == nullptr) {
      return;
    }
    data_ = grown;
    data_[size_++] = item;
  }

  size_t size() const { return size_; }
  bool get(size_t i, T &out) const {
    if (i >= size_) return false;
    out = data_[i];
    return true;
  }

private:
  size_t size_;
  T *data_;
};
