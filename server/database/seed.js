/**
 * Script de seed - Données initiales pour C Mastery App
 * Inclut tous les modules, topics, projets et badges
 */
const { pool } = require('../src/config/database');
require('dotenv').config();

// ============================================
// DONNÉES DES MODULES
// ============================================
const modules = [
  {
    slug: 'memory-mastery',
    title: 'Maîtrise de la Mémoire',
    description: 'Allocation dynamique avancée, memory mapping, optimisation cache',
    icon: '🧠',
    color: '#8B5CF6',
    estimated_hours: 40,
    position: 1
  },
  {
    slug: 'pointers-lowlevel',
    title: 'Pointeurs & Bas Niveau',
    description: 'Pointeurs avancés, inline assembly, manipulation de bits',
    icon: '🔧',
    color: '#EF4444',
    estimated_hours: 35,
    position: 2
  },
  {
    slug: 'filesystem',
    title: 'Système de Fichiers',
    description: 'Fichiers avancés, systèmes de fichiers, FUSE',
    icon: '📁',
    color: '#10B981',
    estimated_hours: 30,
    position: 3
  },
  {
    slug: 'network-sockets',
    title: 'Sockets Réseau',
    description: 'TCP/UDP avancé, protocoles réseau, haute performance',
    icon: '🌐',
    color: '#3B82F6',
    estimated_hours: 40,
    position: 4
  },
  {
    slug: 'threads-concurrency',
    title: 'Threads & Concurrence',
    description: 'Threads POSIX, synchronisation, modèles de concurrence',
    icon: '⚡',
    color: '#F59E0B',
    estimated_hours: 45,
    position: 5
  },
  {
    slug: 'system-programming',
    title: 'Programmation Système Linux',
    description: 'Processus, IPC, sécurité système, drivers kernel',
    icon: '🐧',
    color: '#6366F1',
    estimated_hours: 50,
    position: 6
  }
];

// ============================================
// DONNÉES DES TOPICS
// ============================================
const topics = [
  // MODULE 1: Mémoire
  {
    module_slug: 'memory-mastery',
    slug: 'dynamic-allocation',
    title: 'Allocation Dynamique Avancée',
    description: 'Comprendre et implémenter des allocateurs mémoire personnalisés',
    difficulty: 3,
    estimated_hours: 15,
    points_reward: 100,
    position_in_module: 1,
    content: {
      objectives: [
        'Comprendre les implémentations de malloc/free',
        'Créer des allocateurs personnalisés (slab, pool)',
        'Gérer l\'alignement mémoire (aligned_alloc)',
        'Implémenter le garbage collection manuel'
      ],
      theory: `
## Introduction à l'Allocation Dynamique

L'allocation dynamique est au cœur de la programmation C avancée. Comprendre comment malloc() et free() fonctionnent en interne vous permettra d'optimiser vos programmes et de créer des allocateurs spécialisés.

### Comment fonctionne malloc() ?

malloc() utilise généralement une liste chaînée de blocs libres (free list). Quand vous demandez de la mémoire :

1. Le système parcourt la free list
2. Il trouve un bloc assez grand (first-fit, best-fit, ou worst-fit)
3. Il divise le bloc si nécessaire
4. Il retourne un pointeur vers la zone utilisable

### Structures de données internes

\`\`\`c
typedef struct block_header {
    size_t size;           // Taille du bloc (incluant header)
    int is_free;           // 1 si libre, 0 si alloué
    struct block_header *next;  // Prochain bloc dans la liste
} block_header_t;
\`\`\`

### Alignement Mémoire

L'alignement est crucial pour les performances :

\`\`\`c
// Aligner sur 16 bytes (typique pour SSE)
void *aligned_ptr = aligned_alloc(16, size);

// Macro pour calculer l'alignement
#define ALIGN(size, alignment) \\
    (((size) + (alignment) - 1) & ~((alignment) - 1))
\`\`\`
      `,
      examples: [
        {
          title: 'Allocateur Simple',
          code: `#include <stdio.h>
#include <stdint.h>
#include <string.h>

#define HEAP_SIZE 1024 * 1024  // 1 MB
#define ALIGN_SIZE 8

typedef struct block {
    size_t size;
    int free;
    struct block *next;
} block_t;

static char heap[HEAP_SIZE];
static block_t *free_list = NULL;

void heap_init() {
    free_list = (block_t *)heap;
    free_list->size = HEAP_SIZE - sizeof(block_t);
    free_list->free = 1;
    free_list->next = NULL;
}

void *my_malloc(size_t size) {
    // Aligner la taille
    size = (size + ALIGN_SIZE - 1) & ~(ALIGN_SIZE - 1);
    
    block_t *current = free_list;
    while (current) {
        if (current->free && current->size >= size) {
            // Diviser le bloc si assez grand
            if (current->size > size + sizeof(block_t) + ALIGN_SIZE) {
                block_t *new_block = (block_t *)((char *)current + sizeof(block_t) + size);
                new_block->size = current->size - size - sizeof(block_t);
                new_block->free = 1;
                new_block->next = current->next;
                
                current->size = size;
                current->next = new_block;
            }
            current->free = 0;
            return (char *)current + sizeof(block_t);
        }
        current = current->next;
    }
    return NULL;  // Plus de mémoire
}

void my_free(void *ptr) {
    if (!ptr) return;
    
    block_t *block = (block_t *)((char *)ptr - sizeof(block_t));
    block->free = 1;
    
    // Fusion avec le bloc suivant si libre
    if (block->next && block->next->free) {
        block->size += sizeof(block_t) + block->next->size;
        block->next = block->next->next;
    }
}`
        }
      ],
      checkpoints: [
        'Comprendre la structure d\'un bloc mémoire',
        'Implémenter first-fit allocation',
        'Gérer la fragmentation avec la fusion de blocs',
        'Tester avec valgrind pour les fuites'
      ]
    }
  },
  {
    module_slug: 'memory-mastery',
    slug: 'memory-mapping',
    title: 'Memory Mapping & MMU',
    description: 'mmap, mprotect, mlock et huge pages',
    difficulty: 4,
    estimated_hours: 12,
    points_reward: 120,
    position_in_module: 2,
    content: {
      objectives: [
        'Utiliser mmap() pour fichiers et mémoire anonyme',
        'Configurer les permissions avec mprotect()',
        'Verrouiller la mémoire avec mlock()',
        'Optimiser avec les huge pages'
      ],
      theory: `
## Memory Mapping avec mmap()

mmap() permet de mapper des fichiers ou de la mémoire directement dans l'espace d'adressage du processus.

### Avantages de mmap()
- Accès direct sans copie (zero-copy)
- Partage de mémoire entre processus
- Chargement paresseux (lazy loading)
- Gestion automatique par le kernel

### Syntaxe de base

\`\`\`c
#include <sys/mman.h>

void *mmap(void *addr, size_t length, int prot, int flags, int fd, off_t offset);

// Protections
PROT_READ   // Lecture autorisée
PROT_WRITE  // Écriture autorisée
PROT_EXEC   // Exécution autorisée
PROT_NONE   // Aucun accès

// Flags
MAP_SHARED    // Partagé avec autres processus
MAP_PRIVATE   // Copie privée (copy-on-write)
MAP_ANONYMOUS // Pas de fichier associé
MAP_FIXED     // Adresse exacte requise
\`\`\`
      `,
      examples: [
        {
          title: 'Lecture de fichier avec mmap',
          code: `#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <unistd.h>

int main(int argc, char *argv[]) {
    if (argc != 2) {
        fprintf(stderr, "Usage: %s <file>\\n", argv[0]);
        return 1;
    }
    
    int fd = open(argv[1], O_RDONLY);
    if (fd == -1) {
        perror("open");
        return 1;
    }
    
    struct stat sb;
    if (fstat(fd, &sb) == -1) {
        perror("fstat");
        close(fd);
        return 1;
    }
    
    char *mapped = mmap(NULL, sb.st_size, PROT_READ, MAP_PRIVATE, fd, 0);
    if (mapped == MAP_FAILED) {
        perror("mmap");
        close(fd);
        return 1;
    }
    
    // Utiliser le fichier mappé
    printf("Premiers 100 caractères:\\n%.100s\\n", mapped);
    
    // Nettoyage
    munmap(mapped, sb.st_size);
    close(fd);
    return 0;
}`
        }
      ],
      checkpoints: [
        'Mapper un fichier en lecture seule',
        'Créer une mémoire partagée entre processus',
        'Utiliser mprotect pour changer les permissions',
        'Implémenter un cache LRU avec mmap'
      ]
    }
  },
  {
    module_slug: 'memory-mastery',
    slug: 'cache-optimization',
    title: 'Optimisation Cache',
    description: 'Locality, prefetching, padding et false sharing',
    difficulty: 4,
    estimated_hours: 13,
    points_reward: 130,
    position_in_module: 3,
    content: {
      objectives: [
        'Comprendre la locality spatiale et temporelle',
        'Utiliser le prefetching (__builtin_prefetch)',
        'Optimiser le padding et l\'alignement pour le cache',
        'Éviter le false sharing en multi-thread'
      ],
      theory: `
## Optimisation du Cache CPU

Le cache CPU est crucial pour les performances. Un programme bien optimisé peut être 10-100x plus rapide.

### Hiérarchie de Cache
- **L1** : ~32KB, ~4 cycles
- **L2** : ~256KB, ~12 cycles  
- **L3** : ~8MB, ~40 cycles
- **RAM** : ~100+ cycles

### Locality

**Spatiale** : Accéder à des données proches en mémoire
**Temporelle** : Réutiliser des données récemment accédées

### False Sharing

Quand deux threads modifient des variables sur la même ligne de cache :

\`\`\`c
// MAUVAIS - false sharing
struct {
    int counter1;  // Thread 1
    int counter2;  // Thread 2
} shared;

// BON - padding pour éviter le false sharing
struct {
    int counter1;
    char padding[60];  // Séparer sur différentes lignes de cache
    int counter2;
} shared;
\`\`\`
      `,
      examples: [
        {
          title: 'Multiplication de Matrices Optimisée',
          code: `#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#define N 1024
#define BLOCK_SIZE 32

// Version naïve - mauvaise locality
void matmul_naive(double *A, double *B, double *C, int n) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            double sum = 0.0;
            for (int k = 0; k < n; k++) {
                sum += A[i*n + k] * B[k*n + j];
            }
            C[i*n + j] = sum;
        }
    }
}

// Version optimisée avec blocking
void matmul_blocked(double *A, double *B, double *C, int n) {
    for (int ii = 0; ii < n; ii += BLOCK_SIZE) {
        for (int jj = 0; jj < n; jj += BLOCK_SIZE) {
            for (int kk = 0; kk < n; kk += BLOCK_SIZE) {
                // Traiter un bloc
                for (int i = ii; i < ii + BLOCK_SIZE && i < n; i++) {
                    for (int j = jj; j < jj + BLOCK_SIZE && j < n; j++) {
                        double sum = C[i*n + j];
                        for (int k = kk; k < kk + BLOCK_SIZE && k < n; k++) {
                            sum += A[i*n + k] * B[k*n + j];
                        }
                        C[i*n + j] = sum;
                    }
                }
            }
        }
    }
}

int main() {
    double *A = malloc(N * N * sizeof(double));
    double *B = malloc(N * N * sizeof(double));
    double *C = calloc(N * N, sizeof(double));
    
    // Initialiser avec des valeurs aléatoires
    srand(42);
    for (int i = 0; i < N * N; i++) {
        A[i] = (double)rand() / RAND_MAX;
        B[i] = (double)rand() / RAND_MAX;
    }
    
    clock_t start = clock();
    matmul_blocked(A, B, C, N);
    clock_t end = clock();
    
    printf("Temps: %.3f secondes\\n", (double)(end - start) / CLOCKS_PER_SEC);
    
    free(A); free(B); free(C);
    return 0;
}`
        }
      ],
      checkpoints: [
        'Mesurer les cache misses avec perf',
        'Implémenter le blocking pour les matrices',
        'Utiliser __builtin_prefetch',
        'Démontrer l\'impact du false sharing'
      ]
    }
  },
  // MODULE 2: Pointeurs & Bas Niveau
  {
    module_slug: 'pointers-lowlevel',
    slug: 'advanced-pointers',
    title: 'Pointeurs Avancés',
    description: 'Triple pointeurs, tableaux de fonctions, type erasure',
    difficulty: 3,
    estimated_hours: 12,
    points_reward: 100,
    position_in_module: 1,
    content: {
      objectives: [
        'Maîtriser les pointeurs multiples (double, triple)',
        'Créer des tableaux de pointeurs de fonctions',
        'Utiliser void* pour le type erasure',
        'Implémenter le Q-format pour l\'arithmétique fixe'
      ],
      theory: `
## Pointeurs Avancés en C

### Pointeurs Multiples

\`\`\`c
int x = 42;
int *p = &x;      // Pointeur vers int
int **pp = &p;    // Pointeur vers pointeur vers int
int ***ppp = &pp; // Triple pointeur

printf("%d\\n", ***ppp);  // 42
\`\`\`

### Tableaux de Pointeurs de Fonctions

Parfait pour implémenter des machines à états ou des interpréteurs :

\`\`\`c
typedef int (*operation_t)(int, int);

int add(int a, int b) { return a + b; }
int sub(int a, int b) { return a - b; }
int mul(int a, int b) { return a * b; }

operation_t ops[] = {add, sub, mul};

// Appel via le tableau
int result = ops[0](5, 3);  // add(5, 3) = 8
\`\`\`

### Type Erasure avec void*

\`\`\`c
// Structure générique
typedef struct {
    void *data;
    size_t size;
    void (*destructor)(void *);
} generic_t;

void generic_free(generic_t *g) {
    if (g->destructor) g->destructor(g->data);
    free(g->data);
}
\`\`\`
      `,
      examples: [
        {
          title: 'Machine Virtuelle Simple',
          code: `#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>

#define STACK_SIZE 256

typedef enum {
    OP_PUSH,
    OP_POP,
    OP_ADD,
    OP_SUB,
    OP_MUL,
    OP_DIV,
    OP_PRINT,
    OP_HALT
} opcode_t;

typedef struct {
    int32_t stack[STACK_SIZE];
    int sp;  // Stack pointer
    int running;
} vm_t;

// Handlers d'instructions
typedef void (*op_handler_t)(vm_t *, int32_t);

void op_push(vm_t *vm, int32_t arg) {
    vm->stack[vm->sp++] = arg;
}

void op_pop(vm_t *vm, int32_t arg) {
    vm->sp--;
}

void op_add(vm_t *vm, int32_t arg) {
    int32_t b = vm->stack[--vm->sp];
    int32_t a = vm->stack[--vm->sp];
    vm->stack[vm->sp++] = a + b;
}

void op_sub(vm_t *vm, int32_t arg) {
    int32_t b = vm->stack[--vm->sp];
    int32_t a = vm->stack[--vm->sp];
    vm->stack[vm->sp++] = a - b;
}

void op_mul(vm_t *vm, int32_t arg) {
    int32_t b = vm->stack[--vm->sp];
    int32_t a = vm->stack[--vm->sp];
    vm->stack[vm->sp++] = a * b;
}

void op_div(vm_t *vm, int32_t arg) {
    int32_t b = vm->stack[--vm->sp];
    int32_t a = vm->stack[--vm->sp];
    vm->stack[vm->sp++] = a / b;
}

void op_print(vm_t *vm, int32_t arg) {
    printf("TOP: %d\\n", vm->stack[vm->sp - 1]);
}

void op_halt(vm_t *vm, int32_t arg) {
    vm->running = 0;
}

// Table de dispatch
op_handler_t handlers[] = {
    [OP_PUSH] = op_push,
    [OP_POP] = op_pop,
    [OP_ADD] = op_add,
    [OP_SUB] = op_sub,
    [OP_MUL] = op_mul,
    [OP_DIV] = op_div,
    [OP_PRINT] = op_print,
    [OP_HALT] = op_halt
};

void vm_run(vm_t *vm, uint8_t *bytecode, size_t len) {
    vm->sp = 0;
    vm->running = 1;
    size_t pc = 0;
    
    while (vm->running && pc < len) {
        uint8_t op = bytecode[pc++];
        int32_t arg = 0;
        
        if (op == OP_PUSH) {
            arg = *(int32_t *)(bytecode + pc);
            pc += 4;
        }
        
        handlers[op](vm, arg);
    }
}

int main() {
    vm_t vm = {0};
    
    // Programme: (5 + 3) * 2 = 16
    uint8_t program[] = {
        OP_PUSH, 5, 0, 0, 0,   // PUSH 5
        OP_PUSH, 3, 0, 0, 0,   // PUSH 3
        OP_ADD,                 // ADD
        OP_PUSH, 2, 0, 0, 0,   // PUSH 2
        OP_MUL,                 // MUL
        OP_PRINT,               // PRINT
        OP_HALT                 // HALT
    };
    
    vm_run(&vm, program, sizeof(program));
    return 0;
}`
        }
      ],
      checkpoints: [
        'Créer une structure avec pointeurs multiples',
        'Implémenter une table de dispatch',
        'Utiliser void* pour une liste générique',
        'Créer une VM stack-based fonctionnelle'
      ]
    }
  },
  {
    module_slug: 'pointers-lowlevel',
    slug: 'inline-assembly',
    title: 'Inline Assembly',
    description: 'Syntaxe AT&T/Intel, constraints, intrinsics',
    difficulty: 5,
    estimated_hours: 12,
    points_reward: 150,
    position_in_module: 2,
    content: {
      objectives: [
        'Maîtriser la syntaxe AT&T et Intel',
        'Comprendre les constraints et clobbers',
        'Utiliser les intrinsics GCC/Clang',
        'Écrire des wrappers C pour l\'assembleur'
      ],
      theory: `
## Inline Assembly en C

### Syntaxe GCC (AT&T)

\`\`\`c
asm volatile (
    "instruction"
    : outputs
    : inputs
    : clobbers
);
\`\`\`

### Constraints Courants
- \`r\` : registre général
- \`m\` : mémoire
- \`i\` : immédiat
- \`=\` : output only
- \`+\` : input/output

### Exemple Simple

\`\`\`c
int add_asm(int a, int b) {
    int result;
    asm (
        "addl %2, %1\\n\\t"
        "movl %1, %0"
        : "=r" (result)
        : "r" (a), "r" (b)
    );
    return result;
}
\`\`\`
      `,
      examples: [
        {
          title: 'Opérations SIMD avec Intrinsics',
          code: `#include <stdio.h>
#include <immintrin.h>  // Pour SSE/AVX

// Addition de vecteurs avec SSE
void vector_add_sse(float *a, float *b, float *result, int n) {
    for (int i = 0; i < n; i += 4) {
        __m128 va = _mm_loadu_ps(a + i);
        __m128 vb = _mm_loadu_ps(b + i);
        __m128 vr = _mm_add_ps(va, vb);
        _mm_storeu_ps(result + i, vr);
    }
}

// CPUID pour détecter les features CPU
void get_cpu_info() {
    unsigned int eax, ebx, ecx, edx;
    
    asm volatile (
        "cpuid"
        : "=a" (eax), "=b" (ebx), "=c" (ecx), "=d" (edx)
        : "a" (1)
    );
    
    printf("SSE: %s\\n", (edx & (1 << 25)) ? "Oui" : "Non");
    printf("SSE2: %s\\n", (edx & (1 << 26)) ? "Oui" : "Non");
    printf("AVX: %s\\n", (ecx & (1 << 28)) ? "Oui" : "Non");
}

int main() {
    float a[8] = {1, 2, 3, 4, 5, 6, 7, 8};
    float b[8] = {8, 7, 6, 5, 4, 3, 2, 1};
    float r[8];
    
    vector_add_sse(a, b, r, 8);
    
    printf("Résultat: ");
    for (int i = 0; i < 8; i++) {
        printf("%.0f ", r[i]);
    }
    printf("\\n");
    
    get_cpu_info();
    return 0;
}`
        }
      ],
      checkpoints: [
        'Écrire une fonction en inline assembly',
        'Utiliser les intrinsics SSE',
        'Mesurer le gain de performance',
        'Implémenter une fonction crypto optimisée'
      ]
    }
  },
  {
    module_slug: 'pointers-lowlevel',
    slug: 'bit-manipulation',
    title: 'Manipulation de Bits',
    description: 'Bit fields, bitsets, SWAR, popcount',
    difficulty: 3,
    estimated_hours: 11,
    points_reward: 100,
    position_in_module: 3,
    content: {
      objectives: [
        'Maîtriser les bit fields et le packing',
        'Implémenter des opérations bitset efficaces',
        'Utiliser SWAR (SIMD Within A Register)',
        'Optimiser avec popcount et bit reversals'
      ],
      theory: `
## Manipulation de Bits Avancée

### Bit Fields

\`\`\`c
struct packet_header {
    unsigned int version : 4;
    unsigned int type : 4;
    unsigned int flags : 8;
    unsigned int length : 16;
} __attribute__((packed));
\`\`\`

### Opérations Bit à Bit Utiles

\`\`\`c
// Tester un bit
#define TEST_BIT(x, n) ((x) & (1 << (n)))

// Mettre un bit à 1
#define SET_BIT(x, n) ((x) |= (1 << (n)))

// Mettre un bit à 0
#define CLEAR_BIT(x, n) ((x) &= ~(1 << (n)))

// Inverser un bit
#define TOGGLE_BIT(x, n) ((x) ^= (1 << (n)))

// Compter les bits à 1 (popcount)
int popcount(unsigned int x) {
    return __builtin_popcount(x);
}
\`\`\`
      `,
      examples: [
        {
          title: 'Compression RLE avec Bits',
          code: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>

// Structure pour un run RLE
typedef struct {
    uint8_t count;  // Nombre de répétitions (1-255)
    uint8_t value;  // Valeur répétée
} rle_run_t;

// Encoder en RLE
size_t rle_encode(const uint8_t *input, size_t len, uint8_t *output) {
    size_t out_pos = 0;
    size_t i = 0;
    
    while (i < len) {
        uint8_t value = input[i];
        uint8_t count = 1;
        
        // Compter les répétitions
        while (i + count < len && input[i + count] == value && count < 255) {
            count++;
        }
        
        output[out_pos++] = count;
        output[out_pos++] = value;
        i += count;
    }
    
    return out_pos;
}

// Décoder RLE
size_t rle_decode(const uint8_t *input, size_t len, uint8_t *output) {
    size_t out_pos = 0;
    
    for (size_t i = 0; i < len; i += 2) {
        uint8_t count = input[i];
        uint8_t value = input[i + 1];
        
        for (uint8_t j = 0; j < count; j++) {
            output[out_pos++] = value;
        }
    }
    
    return out_pos;
}

// Bitset efficace
typedef struct {
    uint64_t *bits;
    size_t size;
} bitset_t;

bitset_t *bitset_create(size_t size) {
    bitset_t *bs = malloc(sizeof(bitset_t));
    bs->size = size;
    bs->bits = calloc((size + 63) / 64, sizeof(uint64_t));
    return bs;
}

void bitset_set(bitset_t *bs, size_t index) {
    bs->bits[index / 64] |= (1ULL << (index % 64));
}

int bitset_test(bitset_t *bs, size_t index) {
    return (bs->bits[index / 64] >> (index % 64)) & 1;
}

int bitset_popcount(bitset_t *bs) {
    int count = 0;
    for (size_t i = 0; i < (bs->size + 63) / 64; i++) {
        count += __builtin_popcountll(bs->bits[i]);
    }
    return count;
}

int main() {
    // Test RLE
    uint8_t data[] = "AAABBBCCCCDDDDDDEEEE";
    uint8_t encoded[100];
    uint8_t decoded[100];
    
    size_t enc_len = rle_encode(data, strlen((char *)data), encoded);
    printf("Original: %zu bytes, Encoded: %zu bytes\\n", strlen((char *)data), enc_len);
    
    size_t dec_len = rle_decode(encoded, enc_len, decoded);
    decoded[dec_len] = '\\0';
    printf("Decoded: %s\\n", decoded);
    
    // Test Bitset
    bitset_t *bs = bitset_create(1000);
    bitset_set(bs, 42);
    bitset_set(bs, 100);
    bitset_set(bs, 999);
    
    printf("Bit 42: %d, Bit 50: %d\\n", bitset_test(bs, 42), bitset_test(bs, 50));
    printf("Popcount: %d\\n", bitset_popcount(bs));
    
    return 0;
}`
        }
      ],
      checkpoints: [
        'Implémenter un bitset efficace',
        'Créer un encodeur/décodeur RLE',
        'Utiliser __builtin_popcount',
        'Optimiser avec des opérations SWAR'
      ]
    }
  },
  // MODULE 3: Système de Fichiers
  {
    module_slug: 'filesystem',
    slug: 'advanced-files',
    title: 'Fichiers Avancés',
    description: 'File descriptors, opérations atomiques, async I/O',
    difficulty: 3,
    estimated_hours: 15,
    points_reward: 100,
    position_in_module: 1,
    content: {
      objectives: [
        'Comprendre les file descriptors et file tables',
        'Utiliser les opérations atomiques (O_APPEND)',
        'Implémenter les memory-mapped files',
        'Maîtriser l\'async I/O (aio_*, io_uring)'
      ],
      theory: `
## Fichiers Avancés sous Linux

### File Descriptors

Chaque processus a une table de file descriptors :
- 0: stdin
- 1: stdout
- 2: stderr
- 3+: fichiers ouverts

### Flags d'ouverture importants

\`\`\`c
O_RDONLY    // Lecture seule
O_WRONLY    // Écriture seule
O_RDWR      // Lecture/écriture
O_CREAT     // Créer si n'existe pas
O_TRUNC     // Tronquer à 0
O_APPEND    // Écriture atomique à la fin
O_NONBLOCK  // Non bloquant
O_SYNC      // Écriture synchrone
O_DIRECT    // Bypass du cache
\`\`\`
      `,
      examples: [
        {
          title: 'Base de Données Clé-Valeur Simple',
          code: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <fcntl.h>
#include <unistd.h>
#include <sys/mman.h>
#include <sys/stat.h>

#define MAX_KEY_SIZE 64
#define MAX_VALUE_SIZE 256
#define INITIAL_CAPACITY 1024

typedef struct {
    char key[MAX_KEY_SIZE];
    char value[MAX_VALUE_SIZE];
    int valid;
} entry_t;

typedef struct {
    int fd;
    entry_t *data;
    size_t capacity;
    size_t count;
} kvstore_t;

kvstore_t *kvstore_open(const char *filename) {
    kvstore_t *store = malloc(sizeof(kvstore_t));
    
    store->fd = open(filename, O_RDWR | O_CREAT, 0644);
    if (store->fd == -1) {
        free(store);
        return NULL;
    }
    
    struct stat st;
    fstat(store->fd, &st);
    
    if (st.st_size == 0) {
        // Nouveau fichier
        store->capacity = INITIAL_CAPACITY;
        ftruncate(store->fd, store->capacity * sizeof(entry_t));
    } else {
        store->capacity = st.st_size / sizeof(entry_t);
    }
    
    store->data = mmap(NULL, store->capacity * sizeof(entry_t),
                       PROT_READ | PROT_WRITE, MAP_SHARED, store->fd, 0);
    
    if (store->data == MAP_FAILED) {
        close(store->fd);
        free(store);
        return NULL;
    }
    
    // Compter les entrées valides
    store->count = 0;
    for (size_t i = 0; i < store->capacity; i++) {
        if (store->data[i].valid) store->count++;
    }
    
    return store;
}

int kvstore_put(kvstore_t *store, const char *key, const char *value) {
    // Chercher une entrée existante ou vide
    size_t hash = 0;
    for (const char *p = key; *p; p++) hash = hash * 31 + *p;
    
    size_t index = hash % store->capacity;
    size_t start = index;
    
    do {
        if (!store->data[index].valid || 
            strcmp(store->data[index].key, key) == 0) {
            strncpy(store->data[index].key, key, MAX_KEY_SIZE - 1);
            strncpy(store->data[index].value, value, MAX_VALUE_SIZE - 1);
            if (!store->data[index].valid) {
                store->data[index].valid = 1;
                store->count++;
            }
            msync(store->data + index, sizeof(entry_t), MS_SYNC);
            return 0;
        }
        index = (index + 1) % store->capacity;
    } while (index != start);
    
    return -1;  // Table pleine
}

const char *kvstore_get(kvstore_t *store, const char *key) {
    size_t hash = 0;
    for (const char *p = key; *p; p++) hash = hash * 31 + *p;
    
    size_t index = hash % store->capacity;
    size_t start = index;
    
    do {
        if (store->data[index].valid && 
            strcmp(store->data[index].key, key) == 0) {
            return store->data[index].value;
        }
        if (!store->data[index].valid) break;
        index = (index + 1) % store->capacity;
    } while (index != start);
    
    return NULL;
}

void kvstore_close(kvstore_t *store) {
    munmap(store->data, store->capacity * sizeof(entry_t));
    close(store->fd);
    free(store);
}

int main() {
    kvstore_t *store = kvstore_open("test.db");
    
    kvstore_put(store, "name", "Alice");
    kvstore_put(store, "age", "30");
    kvstore_put(store, "city", "Paris");
    
    printf("name: %s\\n", kvstore_get(store, "name"));
    printf("age: %s\\n", kvstore_get(store, "age"));
    printf("city: %s\\n", kvstore_get(store, "city"));
    
    kvstore_close(store);
    return 0;
}`
        }
      ],
      checkpoints: [
        'Implémenter des opérations de fichiers atomiques',
        'Créer un fichier mappé en mémoire',
        'Utiliser O_DIRECT pour bypass le cache',
        'Implémenter un KV store persistant'
      ]
    }
  },
  // MODULE 4: Sockets Réseau
  {
    module_slug: 'network-sockets',
    slug: 'tcp-udp-advanced',
    title: 'TCP/UDP Avancé',
    description: 'Options socket, non-blocking I/O, epoll',
    difficulty: 4,
    estimated_hours: 15,
    points_reward: 120,
    position_in_module: 1,
    content: {
      objectives: [
        'Configurer les options socket avancées',
        'Implémenter le non-blocking I/O avec poll/epoll',
        'Utiliser le zero-copy networking',
        'Gérer les connexions keep-alive'
      ],
      theory: `
## Sockets Avancés

### Options Socket Importantes

\`\`\`c
// Désactiver l'algorithme de Nagle
int flag = 1;
setsockopt(fd, IPPROTO_TCP, TCP_NODELAY, &flag, sizeof(flag));

// Réutiliser l'adresse immédiatement
setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &flag, sizeof(flag));

// Keep-alive
setsockopt(fd, SOL_SOCKET, SO_KEEPALIVE, &flag, sizeof(flag));
\`\`\`

### epoll pour la haute performance

\`\`\`c
int epfd = epoll_create1(0);

struct epoll_event ev;
ev.events = EPOLLIN | EPOLLET;  // Edge-triggered
ev.data.fd = listen_fd;
epoll_ctl(epfd, EPOLL_CTL_ADD, listen_fd, &ev);

struct epoll_event events[MAX_EVENTS];
int n = epoll_wait(epfd, events, MAX_EVENTS, -1);
\`\`\`
      `,
      examples: [
        {
          title: 'Serveur HTTP Simple avec epoll',
          code: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <errno.h>
#include <sys/socket.h>
#include <sys/epoll.h>
#include <netinet/in.h>
#include <netinet/tcp.h>

#define PORT 8080
#define MAX_EVENTS 1024
#define BUFFER_SIZE 4096

const char *HTTP_RESPONSE = 
    "HTTP/1.1 200 OK\\r\\n"
    "Content-Type: text/html\\r\\n"
    "Content-Length: 13\\r\\n"
    "Connection: keep-alive\\r\\n"
    "\\r\\n"
    "Hello, World!";

int set_nonblocking(int fd) {
    int flags = fcntl(fd, F_GETFL, 0);
    return fcntl(fd, F_SETFL, flags | O_NONBLOCK);
}

int main() {
    int listen_fd = socket(AF_INET, SOCK_STREAM, 0);
    
    int opt = 1;
    setsockopt(listen_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
    setsockopt(listen_fd, IPPROTO_TCP, TCP_NODELAY, &opt, sizeof(opt));
    
    struct sockaddr_in addr = {
        .sin_family = AF_INET,
        .sin_port = htons(PORT),
        .sin_addr.s_addr = INADDR_ANY
    };
    
    bind(listen_fd, (struct sockaddr *)&addr, sizeof(addr));
    listen(listen_fd, SOMAXCONN);
    set_nonblocking(listen_fd);
    
    int epfd = epoll_create1(0);
    struct epoll_event ev = {.events = EPOLLIN, .data.fd = listen_fd};
    epoll_ctl(epfd, EPOLL_CTL_ADD, listen_fd, &ev);
    
    struct epoll_event events[MAX_EVENTS];
    char buffer[BUFFER_SIZE];
    
    printf("Serveur HTTP sur le port %d\\n", PORT);
    
    while (1) {
        int n = epoll_wait(epfd, events, MAX_EVENTS, -1);
        
        for (int i = 0; i < n; i++) {
            if (events[i].data.fd == listen_fd) {
                // Nouvelle connexion
                struct sockaddr_in client_addr;
                socklen_t client_len = sizeof(client_addr);
                int client_fd = accept(listen_fd, 
                    (struct sockaddr *)&client_addr, &client_len);
                
                if (client_fd != -1) {
                    set_nonblocking(client_fd);
                    ev.events = EPOLLIN | EPOLLET;
                    ev.data.fd = client_fd;
                    epoll_ctl(epfd, EPOLL_CTL_ADD, client_fd, &ev);
                }
            } else {
                // Données à lire
                int fd = events[i].data.fd;
                ssize_t bytes = read(fd, buffer, BUFFER_SIZE);
                
                if (bytes <= 0) {
                    epoll_ctl(epfd, EPOLL_CTL_DEL, fd, NULL);
                    close(fd);
                } else {
                    // Envoyer la réponse
                    write(fd, HTTP_RESPONSE, strlen(HTTP_RESPONSE));
                }
            }
        }
    }
    
    return 0;
}`
        }
      ],
      checkpoints: [
        'Créer un serveur TCP non-bloquant',
        'Utiliser epoll pour gérer plusieurs connexions',
        'Implémenter le keep-alive HTTP',
        'Tester avec 1000+ connexions simultanées'
      ]
    }
  },
  // MODULE 5: Threads
  {
    module_slug: 'threads-concurrency',
    slug: 'posix-threads',
    title: 'Threads POSIX',
    description: 'Thread pools, work stealing, TLS',
    difficulty: 4,
    estimated_hours: 15,
    points_reward: 120,
    position_in_module: 1,
    content: {
      objectives: [
        'Créer des thread pools personnalisés',
        'Implémenter le work stealing',
        'Utiliser le thread-local storage',
        'Gérer le graceful shutdown'
      ],
      theory: `
## Threads POSIX Avancés

### Création de Thread Pool

Un thread pool permet de réutiliser les threads au lieu d'en créer de nouveaux :

\`\`\`c
typedef struct {
    pthread_t *threads;
    int thread_count;
    queue_t *task_queue;
    pthread_mutex_t lock;
    pthread_cond_t cond;
    int shutdown;
} threadpool_t;
\`\`\`

### Thread-Local Storage

\`\`\`c
// Déclaration TLS
__thread int thread_id;

// Ou avec pthread
pthread_key_t key;
pthread_key_create(&key, NULL);
pthread_setspecific(key, value);
void *val = pthread_getspecific(key);
\`\`\`
      `,
      examples: [
        {
          title: 'Thread Pool Complet',
          code: `#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <unistd.h>

#define MAX_QUEUE 256

typedef struct task {
    void (*function)(void *);
    void *argument;
} task_t;

typedef struct {
    pthread_t *threads;
    int thread_count;
    
    task_t queue[MAX_QUEUE];
    int queue_head;
    int queue_tail;
    int queue_count;
    
    pthread_mutex_t lock;
    pthread_cond_t notify;
    
    int shutdown;
    int started;
} threadpool_t;

void *worker_thread(void *arg) {
    threadpool_t *pool = (threadpool_t *)arg;
    
    while (1) {
        pthread_mutex_lock(&pool->lock);
        
        while (pool->queue_count == 0 && !pool->shutdown) {
            pthread_cond_wait(&pool->notify, &pool->lock);
        }
        
        if (pool->shutdown && pool->queue_count == 0) {
            pthread_mutex_unlock(&pool->lock);
            break;
        }
        
        task_t task = pool->queue[pool->queue_head];
        pool->queue_head = (pool->queue_head + 1) % MAX_QUEUE;
        pool->queue_count--;
        
        pthread_mutex_unlock(&pool->lock);
        
        task.function(task.argument);
    }
    
    return NULL;
}

threadpool_t *threadpool_create(int thread_count) {
    threadpool_t *pool = malloc(sizeof(threadpool_t));
    
    pool->thread_count = thread_count;
    pool->threads = malloc(sizeof(pthread_t) * thread_count);
    pool->queue_head = pool->queue_tail = pool->queue_count = 0;
    pool->shutdown = 0;
    pool->started = 0;
    
    pthread_mutex_init(&pool->lock, NULL);
    pthread_cond_init(&pool->notify, NULL);
    
    for (int i = 0; i < thread_count; i++) {
        pthread_create(&pool->threads[i], NULL, worker_thread, pool);
        pool->started++;
    }
    
    return pool;
}

int threadpool_add(threadpool_t *pool, void (*function)(void *), void *arg) {
    pthread_mutex_lock(&pool->lock);
    
    if (pool->queue_count == MAX_QUEUE) {
        pthread_mutex_unlock(&pool->lock);
        return -1;
    }
    
    pool->queue[pool->queue_tail].function = function;
    pool->queue[pool->queue_tail].argument = arg;
    pool->queue_tail = (pool->queue_tail + 1) % MAX_QUEUE;
    pool->queue_count++;
    
    pthread_cond_signal(&pool->notify);
    pthread_mutex_unlock(&pool->lock);
    
    return 0;
}

void threadpool_destroy(threadpool_t *pool) {
    pthread_mutex_lock(&pool->lock);
    pool->shutdown = 1;
    pthread_cond_broadcast(&pool->notify);
    pthread_mutex_unlock(&pool->lock);
    
    for (int i = 0; i < pool->started; i++) {
        pthread_join(pool->threads[i], NULL);
    }
    
    free(pool->threads);
    pthread_mutex_destroy(&pool->lock);
    pthread_cond_destroy(&pool->notify);
    free(pool);
}

// Exemple d'utilisation
void print_task(void *arg) {
    int *num = (int *)arg;
    printf("Task %d executed by thread %lu\\n", *num, pthread_self());
    usleep(100000);
    free(num);
}

int main() {
    threadpool_t *pool = threadpool_create(4);
    
    for (int i = 0; i < 20; i++) {
        int *arg = malloc(sizeof(int));
        *arg = i;
        threadpool_add(pool, print_task, arg);
    }
    
    sleep(3);
    threadpool_destroy(pool);
    
    return 0;
}`
        }
      ],
      checkpoints: [
        'Implémenter un thread pool basique',
        'Ajouter une queue de tâches thread-safe',
        'Gérer le shutdown gracieux',
        'Tester avec des charges variées'
      ]
    }
  },
  {
    module_slug: 'threads-concurrency',
    slug: 'synchronization',
    title: 'Synchronisation Avancée',
    description: 'RW locks, barriers, lock-free structures',
    difficulty: 5,
    estimated_hours: 15,
    points_reward: 150,
    position_in_module: 2,
    content: {
      objectives: [
        'Utiliser les read-write locks',
        'Implémenter des barriers et phasers',
        'Créer des structures lock-free',
        'Éviter les deadlocks et race conditions'
      ],
      theory: `
## Synchronisation Avancée

### Read-Write Locks

Permettent plusieurs lecteurs simultanés mais un seul écrivain :

\`\`\`c
pthread_rwlock_t rwlock;
pthread_rwlock_init(&rwlock, NULL);

// Lecture
pthread_rwlock_rdlock(&rwlock);
// ... lecture ...
pthread_rwlock_unlock(&rwlock);

// Écriture
pthread_rwlock_wrlock(&rwlock);
// ... écriture ...
pthread_rwlock_unlock(&rwlock);
\`\`\`

### Structures Lock-Free

Utilisent des opérations atomiques au lieu de locks :

\`\`\`c
#include <stdatomic.h>

typedef struct node {
    int value;
    _Atomic(struct node *) next;
} node_t;

// Compare-and-swap
atomic_compare_exchange_weak(&ptr, &expected, desired);
\`\`\`
      `,
      examples: [
        {
          title: 'Queue Lock-Free (SPSC)',
          code: `#include <stdio.h>
#include <stdlib.h>
#include <stdatomic.h>
#include <pthread.h>

#define QUEUE_SIZE 1024

typedef struct {
    int buffer[QUEUE_SIZE];
    _Atomic size_t head;
    _Atomic size_t tail;
} spsc_queue_t;

void queue_init(spsc_queue_t *q) {
    atomic_store(&q->head, 0);
    atomic_store(&q->tail, 0);
}

int queue_push(spsc_queue_t *q, int value) {
    size_t tail = atomic_load_explicit(&q->tail, memory_order_relaxed);
    size_t next_tail = (tail + 1) % QUEUE_SIZE;
    
    if (next_tail == atomic_load_explicit(&q->head, memory_order_acquire)) {
        return 0;  // Queue pleine
    }
    
    q->buffer[tail] = value;
    atomic_store_explicit(&q->tail, next_tail, memory_order_release);
    return 1;
}

int queue_pop(spsc_queue_t *q, int *value) {
    size_t head = atomic_load_explicit(&q->head, memory_order_relaxed);
    
    if (head == atomic_load_explicit(&q->tail, memory_order_acquire)) {
        return 0;  // Queue vide
    }
    
    *value = q->buffer[head];
    atomic_store_explicit(&q->head, (head + 1) % QUEUE_SIZE, memory_order_release);
    return 1;
}

// Test
spsc_queue_t queue;
_Atomic int done = 0;

void *producer(void *arg) {
    for (int i = 0; i < 100000; i++) {
        while (!queue_push(&queue, i)) {
            // Spin
        }
    }
    atomic_store(&done, 1);
    return NULL;
}

void *consumer(void *arg) {
    int value;
    int count = 0;
    
    while (!atomic_load(&done) || queue_pop(&queue, &value)) {
        if (queue_pop(&queue, &value)) {
            count++;
        }
    }
    
    printf("Consumed %d items\\n", count);
    return NULL;
}

int main() {
    queue_init(&queue);
    
    pthread_t prod, cons;
    pthread_create(&prod, NULL, producer, NULL);
    pthread_create(&cons, NULL, consumer, NULL);
    
    pthread_join(prod, NULL);
    pthread_join(cons, NULL);
    
    return 0;
}`
        }
      ],
      checkpoints: [
        'Implémenter un RW lock custom',
        'Créer une queue lock-free SPSC',
        'Tester avec des stress tests',
        'Mesurer les performances vs mutex'
      ]
    }
  },
  // MODULE 6: Programmation Système
  {
    module_slug: 'system-programming',
    slug: 'advanced-processes',
    title: 'Processus Avancés',
    description: 'Process groups, daemonization, capabilities',
    difficulty: 4,
    estimated_hours: 12,
    points_reward: 120,
    position_in_module: 1,
    content: {
      objectives: [
        'Comprendre les process groups et sessions',
        'Implémenter une daemonization correcte',
        'Utiliser les capabilities Linux',
        'Gérer les signaux avancés'
      ],
      theory: `
## Processus Avancés Linux

### Daemonization

Un daemon doit :
1. Fork et terminer le parent
2. Créer une nouvelle session (setsid)
3. Changer le répertoire de travail
4. Fermer les file descriptors
5. Rediriger stdin/stdout/stderr

### Capabilities

Les capabilities permettent des privilèges granulaires :

\`\`\`c
#include <sys/capability.h>

cap_t caps = cap_get_proc();
cap_value_t cap_list[] = {CAP_NET_BIND_SERVICE};
cap_set_flag(caps, CAP_EFFECTIVE, 1, cap_list, CAP_SET);
cap_set_proc(caps);
\`\`\`
      `,
      examples: [
        {
          title: 'Daemon de Supervision',
          code: `#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <signal.h>
#include <sys/stat.h>
#include <sys/wait.h>
#include <fcntl.h>
#include <string.h>
#include <errno.h>
#include <syslog.h>

#define MAX_CHILDREN 10

typedef struct {
    char *command;
    pid_t pid;
    int restart_count;
    int max_restarts;
} supervised_t;

supervised_t children[MAX_CHILDREN];
int child_count = 0;
volatile sig_atomic_t running = 1;

void signal_handler(int sig) {
    if (sig == SIGTERM || sig == SIGINT) {
        running = 0;
    }
}

void daemonize() {
    pid_t pid = fork();
    if (pid < 0) exit(EXIT_FAILURE);
    if (pid > 0) exit(EXIT_SUCCESS);
    
    if (setsid() < 0) exit(EXIT_FAILURE);
    
    signal(SIGCHLD, SIG_IGN);
    signal(SIGHUP, SIG_IGN);
    
    pid = fork();
    if (pid < 0) exit(EXIT_FAILURE);
    if (pid > 0) exit(EXIT_SUCCESS);
    
    umask(0);
    chdir("/");
    
    for (int fd = sysconf(_SC_OPEN_MAX); fd >= 0; fd--) {
        close(fd);
    }
    
    open("/dev/null", O_RDWR);
    dup(0);
    dup(0);
    
    openlog("supervisor", LOG_PID, LOG_DAEMON);
}

pid_t start_child(const char *command) {
    pid_t pid = fork();
    
    if (pid == 0) {
        execl("/bin/sh", "sh", "-c", command, NULL);
        _exit(127);
    }
    
    return pid;
}

void supervise() {
    while (running) {
        int status;
        pid_t pid = waitpid(-1, &status, WNOHANG);
        
        if (pid > 0) {
            for (int i = 0; i < child_count; i++) {
                if (children[i].pid == pid) {
                    syslog(LOG_WARNING, "Child %s (PID %d) exited", 
                           children[i].command, pid);
                    
                    if (children[i].restart_count < children[i].max_restarts) {
                        children[i].pid = start_child(children[i].command);
                        children[i].restart_count++;
                        syslog(LOG_INFO, "Restarted %s (PID %d)", 
                               children[i].command, children[i].pid);
                    }
                    break;
                }
            }
        }
        
        sleep(1);
    }
    
    // Arrêter tous les enfants
    for (int i = 0; i < child_count; i++) {
        if (children[i].pid > 0) {
            kill(children[i].pid, SIGTERM);
        }
    }
    
    syslog(LOG_INFO, "Supervisor shutting down");
    closelog();
}

int main(int argc, char *argv[]) {
    if (argc < 2) {
        fprintf(stderr, "Usage: %s <command> [command2] ...\\n", argv[0]);
        return 1;
    }
    
    signal(SIGTERM, signal_handler);
    signal(SIGINT, signal_handler);
    
    daemonize();
    
    for (int i = 1; i < argc && child_count < MAX_CHILDREN; i++) {
        children[child_count].command = argv[i];
        children[child_count].pid = start_child(argv[i]);
        children[child_count].restart_count = 0;
        children[child_count].max_restarts = 5;
        
        syslog(LOG_INFO, "Started %s (PID %d)", argv[i], children[child_count].pid);
        child_count++;
    }
    
    supervise();
    return 0;
}`
        }
      ],
      checkpoints: [
        'Implémenter une daemonization correcte',
        'Gérer les signaux SIGCHLD',
        'Créer un superviseur de processus',
        'Tester le redémarrage automatique'
      ]
    }
  },
  {
    module_slug: 'system-programming',
    slug: 'ipc',
    title: 'IPC (Inter-Process Communication)',
    description: 'Pipes, message queues, shared memory, semaphores',
    difficulty: 4,
    estimated_hours: 13,
    points_reward: 120,
    position_in_module: 2,
    content: {
      objectives: [
        'Utiliser les pipes anonymes et nommés',
        'Implémenter les message queues POSIX',
        'Partager de la mémoire entre processus',
        'Synchroniser avec des sémaphores'
      ],
      theory: `
## Communication Inter-Processus

### Types d'IPC

1. **Pipes** : Communication unidirectionnelle
2. **Message Queues** : Messages structurés avec priorité
3. **Shared Memory** : Mémoire partagée (le plus rapide)
4. **Semaphores** : Synchronisation

### Shared Memory POSIX

\`\`\`c
#include <sys/mman.h>
#include <fcntl.h>

// Créer
int fd = shm_open("/myshm", O_CREAT | O_RDWR, 0666);
ftruncate(fd, SIZE);
void *ptr = mmap(NULL, SIZE, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);

// Supprimer
shm_unlink("/myshm");
\`\`\`
      `,
      examples: [
        {
          title: 'Système de Messagerie IPC',
          code: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <semaphore.h>

#define SHM_NAME "/msg_queue"
#define SEM_MUTEX "/msg_mutex"
#define SEM_EMPTY "/msg_empty"
#define SEM_FULL "/msg_full"

#define QUEUE_SIZE 10
#define MSG_SIZE 256

typedef struct {
    char messages[QUEUE_SIZE][MSG_SIZE];
    int head;
    int tail;
    int count;
} msg_queue_t;

typedef struct {
    msg_queue_t *queue;
    sem_t *mutex;
    sem_t *empty;
    sem_t *full;
    int fd;
} ipc_queue_t;

ipc_queue_t *queue_create() {
    ipc_queue_t *q = malloc(sizeof(ipc_queue_t));
    
    q->fd = shm_open(SHM_NAME, O_CREAT | O_RDWR, 0666);
    ftruncate(q->fd, sizeof(msg_queue_t));
    
    q->queue = mmap(NULL, sizeof(msg_queue_t), 
                    PROT_READ | PROT_WRITE, MAP_SHARED, q->fd, 0);
    
    q->queue->head = q->queue->tail = q->queue->count = 0;
    
    q->mutex = sem_open(SEM_MUTEX, O_CREAT, 0666, 1);
    q->empty = sem_open(SEM_EMPTY, O_CREAT, 0666, QUEUE_SIZE);
    q->full = sem_open(SEM_FULL, O_CREAT, 0666, 0);
    
    return q;
}

ipc_queue_t *queue_open() {
    ipc_queue_t *q = malloc(sizeof(ipc_queue_t));
    
    q->fd = shm_open(SHM_NAME, O_RDWR, 0666);
    q->queue = mmap(NULL, sizeof(msg_queue_t), 
                    PROT_READ | PROT_WRITE, MAP_SHARED, q->fd, 0);
    
    q->mutex = sem_open(SEM_MUTEX, 0);
    q->empty = sem_open(SEM_EMPTY, 0);
    q->full = sem_open(SEM_FULL, 0);
    
    return q;
}

void queue_send(ipc_queue_t *q, const char *msg) {
    sem_wait(q->empty);
    sem_wait(q->mutex);
    
    strncpy(q->queue->messages[q->queue->tail], msg, MSG_SIZE - 1);
    q->queue->tail = (q->queue->tail + 1) % QUEUE_SIZE;
    q->queue->count++;
    
    sem_post(q->mutex);
    sem_post(q->full);
}

void queue_receive(ipc_queue_t *q, char *msg) {
    sem_wait(q->full);
    sem_wait(q->mutex);
    
    strncpy(msg, q->queue->messages[q->queue->head], MSG_SIZE);
    q->queue->head = (q->queue->head + 1) % QUEUE_SIZE;
    q->queue->count--;
    
    sem_post(q->mutex);
    sem_post(q->empty);
}

void queue_destroy(ipc_queue_t *q) {
    munmap(q->queue, sizeof(msg_queue_t));
    close(q->fd);
    shm_unlink(SHM_NAME);
    sem_close(q->mutex);
    sem_close(q->empty);
    sem_close(q->full);
    sem_unlink(SEM_MUTEX);
    sem_unlink(SEM_EMPTY);
    sem_unlink(SEM_FULL);
    free(q);
}

// Exemple: Producteur
void producer() {
    ipc_queue_t *q = queue_create();
    
    for (int i = 0; i < 20; i++) {
        char msg[MSG_SIZE];
        snprintf(msg, MSG_SIZE, "Message %d from PID %d", i, getpid());
        queue_send(q, msg);
        printf("Sent: %s\\n", msg);
        usleep(100000);
    }
    
    queue_send(q, "QUIT");
}

// Exemple: Consommateur
void consumer() {
    sleep(1);  // Attendre que le producteur crée la queue
    ipc_queue_t *q = queue_open();
    
    char msg[MSG_SIZE];
    while (1) {
        queue_receive(q, msg);
        printf("Received: %s\\n", msg);
        if (strcmp(msg, "QUIT") == 0) break;
    }
    
    queue_destroy(q);
}

int main(int argc, char *argv[]) {
    if (argc != 2) {
        printf("Usage: %s <producer|consumer>\\n", argv[0]);
        return 1;
    }
    
    if (strcmp(argv[1], "producer") == 0) {
        producer();
    } else {
        consumer();
    }
    
    return 0;
}`
        }
      ],
      checkpoints: [
        'Créer une mémoire partagée POSIX',
        'Synchroniser avec des sémaphores',
        'Implémenter une queue de messages',
        'Tester avec plusieurs processus'
      ]
    }
  }
];

// ============================================
// DONNÉES DES PROJETS
// ============================================
const projects = [
  {
    topic_slug: 'dynamic-allocation',
    slug: 'custom-allocator',
    title: 'Allocateur de Mémoire Personnalisé',
    description: 'Implémenter votre propre version de malloc(), free() et realloc()',
    difficulty: 4,
    points_reward: 300,
    time_limit_minutes: 180,
    requirements: [
      'Implémenter my_malloc() avec gestion de free list',
      'Implémenter my_free() avec fusion de blocs adjacents',
      'Implémenter my_realloc() pour redimensionner',
      'Gérer l\'alignement mémoire sur 8 bytes',
      'Passer tous les tests de validation'
    ],
    starter_code: `#include <stdio.h>
#include <stdint.h>
#include <string.h>

#define HEAP_SIZE (1024 * 1024)  // 1 MB
#define ALIGN 8

// Structure d'un bloc mémoire
typedef struct block {
    size_t size;
    int is_free;
    struct block *next;
} block_t;

static char heap[HEAP_SIZE];
static block_t *free_list = NULL;
static int initialized = 0;

// Initialiser le heap
void heap_init() {
    // TODO: Implémenter l'initialisation
}

// Allouer de la mémoire
void *my_malloc(size_t size) {
    // TODO: Implémenter l'allocation
    return NULL;
}

// Libérer de la mémoire
void my_free(void *ptr) {
    // TODO: Implémenter la libération
}

// Redimensionner une allocation
void *my_realloc(void *ptr, size_t size) {
    // TODO: Implémenter le redimensionnement
    return NULL;
}

// Tests
int main() {
    heap_init();
    
    // Test 1: Allocation simple
    int *arr = my_malloc(10 * sizeof(int));
    if (!arr) {
        printf("FAIL: Allocation failed\\n");
        return 1;
    }
    
    for (int i = 0; i < 10; i++) arr[i] = i;
    printf("PASS: Simple allocation\\n");
    
    // Test 2: Free et réallocation
    my_free(arr);
    arr = my_malloc(5 * sizeof(int));
    if (!arr) {
        printf("FAIL: Reallocation failed\\n");
        return 1;
    }
    printf("PASS: Free and realloc\\n");
    
    // Test 3: Multiple allocations
    void *ptrs[100];
    for (int i = 0; i < 100; i++) {
        ptrs[i] = my_malloc(100);
        if (!ptrs[i]) {
            printf("FAIL: Multiple allocation %d failed\\n", i);
            return 1;
        }
    }
    printf("PASS: Multiple allocations\\n");
    
    // Test 4: Free all
    for (int i = 0; i < 100; i++) {
        my_free(ptrs[i]);
    }
    printf("PASS: Free all\\n");
    
    printf("\\nAll tests passed!\\n");
    return 0;
}`,
    hints: [
      'Commencez par initialiser le heap avec un seul grand bloc libre',
      'Utilisez une macro ALIGN pour arrondir les tailles',
      'N\'oubliez pas de fusionner les blocs adjacents lors du free',
      'Pour realloc, vérifiez d\'abord si le bloc actuel est assez grand'
    ],
    test_cases: [
      { name: 'Compilation', type: 'compilation', expected: 'success' },
      { name: 'Allocation simple', type: 'output', expected: 'PASS: Simple allocation' },
      { name: 'Free et réallocation', type: 'output', expected: 'PASS: Free and realloc' },
      { name: 'Allocations multiples', type: 'output', expected: 'PASS: Multiple allocations' },
      { name: 'Tous les tests', type: 'output', expected: 'All tests passed!' }
    ]
  },
  {
    topic_slug: 'tcp-udp-advanced',
    slug: 'http-server',
    title: 'Serveur HTTP/1.1 avec epoll',
    description: 'Créer un serveur HTTP haute performance supportant les connexions persistantes',
    difficulty: 4,
    points_reward: 350,
    time_limit_minutes: 240,
    requirements: [
      'Supporter les méthodes GET et HEAD',
      'Implémenter le keep-alive HTTP/1.1',
      'Utiliser epoll pour le multiplexage',
      'Servir des fichiers statiques',
      'Gérer au moins 1000 connexions simultanées'
    ],
    starter_code: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/socket.h>
#include <sys/epoll.h>
#include <netinet/in.h>

#define PORT 8080
#define MAX_EVENTS 1024
#define BUFFER_SIZE 4096

// TODO: Implémenter le serveur HTTP

int main() {
    printf("Starting HTTP server on port %d...\\n", PORT);
    
    // TODO: Votre code ici
    
    return 0;
}`,
    hints: [
      'Utilisez EPOLLET (edge-triggered) pour de meilleures performances',
      'Parsez les headers HTTP pour détecter Connection: keep-alive',
      'Utilisez sendfile() pour envoyer des fichiers efficacement',
      'N\'oubliez pas de gérer les erreurs 404 et 500'
    ],
    test_cases: [
      { name: 'Compilation', type: 'compilation', expected: 'success' },
      { name: 'Démarrage serveur', type: 'process', expected: 'running' },
      { name: 'GET request', type: 'http', expected: '200 OK' },
      { name: 'Keep-alive', type: 'http', expected: 'Connection: keep-alive' }
    ]
  },
  {
    topic_slug: 'posix-threads',
    slug: 'thread-pool',
    title: 'Thread Pool avec Work Queue',
    description: 'Implémenter un pool de threads réutilisable avec une queue de tâches',
    difficulty: 4,
    points_reward: 300,
    time_limit_minutes: 180,
    requirements: [
      'Créer un pool de N threads configurables',
      'Implémenter une queue de tâches thread-safe',
      'Supporter l\'ajout dynamique de tâches',
      'Implémenter un shutdown gracieux',
      'Éviter les race conditions et deadlocks'
    ],
    starter_code: `#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <unistd.h>

#define MAX_QUEUE 256

typedef void (*task_func_t)(void *);

typedef struct {
    task_func_t function;
    void *argument;
} task_t;

typedef struct threadpool threadpool_t;

// Créer un nouveau thread pool
threadpool_t *threadpool_create(int num_threads);

// Ajouter une tâche au pool
int threadpool_add(threadpool_t *pool, task_func_t func, void *arg);

// Détruire le pool (attendre la fin des tâches)
void threadpool_destroy(threadpool_t *pool);

// TODO: Implémenter les fonctions ci-dessus

// Test
void test_task(void *arg) {
    int *num = (int *)arg;
    printf("Executing task %d in thread %lu\\n", *num, pthread_self());
    usleep(100000);
    free(num);
}

int main() {
    threadpool_t *pool = threadpool_create(4);
    
    for (int i = 0; i < 20; i++) {
        int *arg = malloc(sizeof(int));
        *arg = i;
        threadpool_add(pool, test_task, arg);
    }
    
    sleep(3);
    threadpool_destroy(pool);
    
    printf("All tasks completed!\\n");
    return 0;
}`,
    hints: [
      'Utilisez pthread_mutex et pthread_cond pour la synchronisation',
      'Les workers doivent attendre sur une condition variable',
      'Utilisez un flag shutdown pour arrêter proprement',
      'Testez avec helgrind pour détecter les race conditions'
    ],
    test_cases: [
      { name: 'Compilation', type: 'compilation', expected: 'success' },
      { name: 'Création pool', type: 'output', expected: 'Executing task' },
      { name: 'Toutes tâches', type: 'output', expected: 'All tasks completed!' },
      { name: 'Pas de deadlock', type: 'timeout', expected: '< 10s' }
    ]
  }
];

// ============================================
// DONNÉES DES BADGES
// ============================================
const badges = [
  {
    id: 'memory_master',
    name: '🧠 Maître de la Mémoire',
    description: 'A terminé tous les projets du module mémoire',
    icon: '🧠',
    category: 'module',
    criteria: { module: 'memory-mastery', completion: 100 },
    points_bonus: 500,
    rarity: 'epic'
  },
  {
    id: 'network_ninja',
    name: '🌐 Ninja du Réseau',
    description: 'A implémenté un serveur supportant 10k+ connexions',
    icon: '🌐',
    category: 'achievement',
    criteria: { project: 'http-server', benchmark: 10000 },
    points_bonus: 750,
    rarity: 'legendary'
  },
  {
    id: 'system_wizard',
    name: '🔧 Magicien du Système',
    description: 'A écrit un driver kernel fonctionnel',
    icon: '🔧',
    category: 'achievement',
    criteria: { module: 'system-programming', completion: 100 },
    points_bonus: 1000,
    rarity: 'legendary'
  },
  {
    id: 'perfectionist',
    name: '💯 Perfectionniste',
    description: '100% de tests passés sur 10 projets consécutifs',
    icon: '💯',
    category: 'streak',
    criteria: { perfect_projects: 10 },
    points_bonus: 300,
    rarity: 'rare'
  },
  {
    id: 'first_blood',
    name: '🩸 Premier Sang',
    description: 'A terminé son premier projet',
    icon: '🩸',
    category: 'milestone',
    criteria: { projects_completed: 1 },
    points_bonus: 50,
    rarity: 'common'
  },
  {
    id: 'early_bird',
    name: '🌅 Lève-tôt',
    description: 'A codé avant 6h du matin',
    icon: '🌅',
    category: 'fun',
    criteria: { activity_before: '06:00' },
    points_bonus: 25,
    rarity: 'common'
  },
  {
    id: 'night_owl',
    name: '🦉 Oiseau de Nuit',
    description: 'A codé après minuit',
    icon: '🦉',
    category: 'fun',
    criteria: { activity_after: '00:00' },
    points_bonus: 25,
    rarity: 'common'
  },
  {
    id: 'streak_7',
    name: '🔥 Semaine de Feu',
    description: '7 jours consécutifs d\'activité',
    icon: '🔥',
    category: 'streak',
    criteria: { streak_days: 7 },
    points_bonus: 100,
    rarity: 'common'
  },
  {
    id: 'streak_30',
    name: '⚡ Mois Électrique',
    description: '30 jours consécutifs d\'activité',
    icon: '⚡',
    category: 'streak',
    criteria: { streak_days: 30 },
    points_bonus: 500,
    rarity: 'epic'
  },
  {
    id: 'pointer_pro',
    name: '👆 Pro des Pointeurs',
    description: 'A maîtrisé tous les sujets sur les pointeurs',
    icon: '👆',
    category: 'module',
    criteria: { module: 'pointers-lowlevel', completion: 100 },
    points_bonus: 400,
    rarity: 'rare'
  },
  {
    id: 'thread_master',
    name: '🧵 Maître des Threads',
    description: 'A terminé le module concurrence',
    icon: '🧵',
    category: 'module',
    criteria: { module: 'threads-concurrency', completion: 100 },
    points_bonus: 600,
    rarity: 'epic'
  },
  {
    id: 'bug_hunter',
    name: '🐛 Chasseur de Bugs',
    description: 'A corrigé 50 erreurs de compilation',
    icon: '🐛',
    category: 'achievement',
    criteria: { compilation_fixes: 50 },
    points_bonus: 150,
    rarity: 'rare'
  }
];

// ============================================
// FONCTION DE SEED
// ============================================
async function seed() {
  console.log('🌱 Début du seeding...\n');
  
  try {
    // Insérer les modules
    console.log('📦 Insertion des modules...');
    for (const module of modules) {
      await pool.query(`
        INSERT INTO modules (slug, title, description, icon, color, estimated_hours, position)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          icon = EXCLUDED.icon,
          color = EXCLUDED.color,
          estimated_hours = EXCLUDED.estimated_hours,
          position = EXCLUDED.position
      `, [module.slug, module.title, module.description, module.icon, module.color, module.estimated_hours, module.position]);
    }
    console.log(`   ✅ ${modules.length} modules insérés`);
    
    // Insérer les topics
    console.log('📚 Insertion des topics...');
    for (const topic of topics) {
      const moduleResult = await pool.query('SELECT id FROM modules WHERE slug = $1', [topic.module_slug]);
      if (moduleResult.rows.length === 0) {
        console.log(`   ⚠️ Module ${topic.module_slug} non trouvé pour ${topic.slug}`);
        continue;
      }
      
      await pool.query(`
        INSERT INTO topics (module_id, slug, title, description, content, difficulty, estimated_hours, points_reward, position_in_module)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          content = EXCLUDED.content,
          difficulty = EXCLUDED.difficulty,
          estimated_hours = EXCLUDED.estimated_hours,
          points_reward = EXCLUDED.points_reward,
          position_in_module = EXCLUDED.position_in_module
      `, [
        moduleResult.rows[0].id,
        topic.slug,
        topic.title,
        topic.description,
        JSON.stringify(topic.content),
        topic.difficulty,
        topic.estimated_hours,
        topic.points_reward,
        topic.position_in_module
      ]);
    }
    console.log(`   ✅ ${topics.length} topics insérés`);
    
    // Insérer les projets
    console.log('🛠️ Insertion des projets...');
    for (const project of projects) {
      const topicResult = await pool.query('SELECT id FROM topics WHERE slug = $1', [project.topic_slug]);
      if (topicResult.rows.length === 0) {
        console.log(`   ⚠️ Topic ${project.topic_slug} non trouvé pour ${project.slug}`);
        continue;
      }
      
      await pool.query(`
        INSERT INTO projects (topic_id, slug, title, description, requirements, starter_code, hints, difficulty, points_reward, time_limit_minutes, test_cases)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          requirements = EXCLUDED.requirements,
          starter_code = EXCLUDED.starter_code,
          hints = EXCLUDED.hints,
          difficulty = EXCLUDED.difficulty,
          points_reward = EXCLUDED.points_reward,
          time_limit_minutes = EXCLUDED.time_limit_minutes,
          test_cases = EXCLUDED.test_cases
      `, [
        topicResult.rows[0].id,
        project.slug,
        project.title,
        project.description,
        JSON.stringify(project.requirements),
        project.starter_code,
        JSON.stringify(project.hints),
        project.difficulty,
        project.points_reward,
        project.time_limit_minutes,
        JSON.stringify(project.test_cases)
      ]);
    }
    console.log(`   ✅ ${projects.length} projets insérés`);
    
    // Insérer les badges
    console.log('🏆 Insertion des badges...');
    for (const badge of badges) {
      await pool.query(`
        INSERT INTO badges (id, name, description, icon, category, criteria, points_bonus, rarity)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          icon = EXCLUDED.icon,
          category = EXCLUDED.category,
          criteria = EXCLUDED.criteria,
          points_bonus = EXCLUDED.points_bonus,
          rarity = EXCLUDED.rarity
      `, [badge.id, badge.name, badge.description, badge.icon, badge.category, JSON.stringify(badge.criteria), badge.points_bonus, badge.rarity]);
    }
    console.log(`   ✅ ${badges.length} badges insérés`);
    
    console.log('\n✅ Seeding terminé avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seed, modules, topics, projects, badges };
