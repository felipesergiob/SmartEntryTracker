#pragma once
#include <stddef.h>
#include <stdlib.h>

/**
 * Vertente 1 — A Abordagem Ineficiente (Anti-Padrão).
 *
 * Este header contém as duas variantes do anti-padrão descritas no enunciado:
 *
 *  1) ShiftBuffer<T>   : janela de tamanho fixo mantida por DESLOCAMENTO de
 *                        elementos. Cada inserção com a janela cheia desloca
 *                        todos os elementos uma posição -> O(n) por inserção.
 *
 *  2) GrowingBuffer<T> : histórico que CRESCE dinamicamente chamando realloc()
 *                        a cada nova leitura. Cada realloc precisa, no pior
 *                        caso, copiar todo o conteúdo já existente -> O(n) por
 *                        inserção e O(n^2) para inserir n amostras, além de
 *                        fragmentar o heap.
 *
 * Ambas servem de contraste direto com o RingBuffer (O(1), sem movimentação
 * de memória em massa).
 */

// ---------------------------------------------------------------------------
// 1) Janela fixa por deslocamento de elementos — O(n) por inserção
// ---------------------------------------------------------------------------
template <typename T>
class ShiftBuffer {
public:
  explicit ShiftBuffer(size_t window) : window_(window), size_(0) {
    data_ = (T *)malloc(sizeof(T) * window_);
  }

  ~ShiftBuffer() { free(data_); }

  /**
   * Insere mantendo a janela fixa. Quando cheia, descarta o elemento mais
   * antigo deslocando TODOS os outros uma posição à esquerda: laço linear
   * no tamanho da janela -> O(n).
   */
  void push(const T &item) {
    if (size_ < window_) {
      data_[size_++] = item;
      return;
    }
    // Janela cheia: desloca tudo (anti-padrão) — O(n)
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

// ---------------------------------------------------------------------------
// 2) Histórico crescente via realloc() a cada leitura — O(n) e fragmentação
// ---------------------------------------------------------------------------
template <typename T>
class GrowingBuffer {
public:
  GrowingBuffer() : size_(0), data_(nullptr) {}

  ~GrowingBuffer() { free(data_); }

  /**
   * Realoca o bloco a cada nova amostra. O realloc, ao não conseguir expandir
   * in-place, aloca um novo bloco e COPIA todo o conteúdo anterior -> O(n).
   * Repetido n vezes => O(n^2) total e fragmentação progressiva do heap.
   */
  void push(const T &item) {
    T *grown = (T *)realloc(data_, sizeof(T) * (size_ + 1));
    if (grown == nullptr) {
      return; // falha de alocação (heap esgotado/fragmentado)
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
