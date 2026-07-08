import type { Question } from '../types';

// ── TECHNICAL (100 questions) ──────────────────────────────────────────────
const technicalQuestions: Question[] = [
  // JavaScript
  { id: 't001', moduleId: 'technical', text: 'What does the `typeof null` expression return in JavaScript?', options: ['null', 'undefined', 'object', 'boolean'], correctIndex: 2, difficulty: 'medium', tags: ['javascript', 'types'], language: 'javascript', points: 2 },
  { id: 't002', moduleId: 'technical', text: 'Which array method returns a new array with all sub-array elements concatenated recursively up to the specified depth?', options: ['concat()', 'flat()', 'flatMap()', 'reduce()'], correctIndex: 1, difficulty: 'medium', tags: ['javascript', 'arrays'], language: 'javascript', points: 2 },
  { id: 't003', moduleId: 'technical', text: 'What is the output of `console.log(0.1 + 0.2 === 0.3)` in JavaScript?', options: ['true', 'false', 'undefined', 'NaN'], correctIndex: 1, difficulty: 'hard', tags: ['javascript', 'floating-point'], language: 'javascript', points: 3 },
  { id: 't004', moduleId: 'technical', text: 'Which keyword is used to define a generator function in JavaScript?', options: ['async', 'yield*', 'function*', 'generate'], correctIndex: 2, difficulty: 'medium', tags: ['javascript', 'generators'], language: 'javascript', points: 2 },
  { id: 't005', moduleId: 'technical', text: 'What is the purpose of the `Symbol.iterator` in JavaScript?', options: ['Create unique identifiers', 'Define a default iterator for an object', 'Iterate over symbol properties', 'Access object metadata'], correctIndex: 1, difficulty: 'hard', tags: ['javascript', 'iterators'], language: 'javascript', points: 3 },
  { id: 't006', moduleId: 'technical', text: 'What does the `Promise.allSettled()` method return?', options: ['Rejects if any promise rejects', 'Resolves with the first resolved value', 'Resolves when all promises settle regardless of outcome', 'Resolves with the fastest promise'], correctIndex: 2, difficulty: 'medium', tags: ['javascript', 'promises'], language: 'javascript', points: 2 },
  { id: 't007', moduleId: 'technical', text: 'Which of the following correctly declares a private class field in JavaScript?', options: ['private name;', '#name;', '_name;', '::name;'], correctIndex: 1, difficulty: 'medium', tags: ['javascript', 'classes'], language: 'javascript', points: 2 },
  { id: 't008', moduleId: 'technical', text: 'What is the output of `[1,2,3].reduce((a,b) => a + b, 10)`?', options: ['6', '16', '10', 'NaN'], correctIndex: 1, difficulty: 'easy', tags: ['javascript', 'arrays'], language: 'javascript', points: 1 },
  { id: 't009', moduleId: 'technical', text: 'Which method converts a JavaScript value to a JSON string?', options: ['JSON.parse()', 'JSON.stringify()', 'JSON.serialize()', 'JSON.encode()'], correctIndex: 1, difficulty: 'easy', tags: ['javascript', 'json'], language: 'javascript', points: 1 },
  { id: 't010', moduleId: 'technical', text: 'What is the event loop in JavaScript responsible for?', options: ['Garbage collection', 'Handling asynchronous callbacks from the queue', 'Compiling JavaScript code', 'Managing memory allocation'], correctIndex: 1, difficulty: 'hard', tags: ['javascript', 'async', 'event-loop'], language: 'javascript', points: 3 },
  // Python
  { id: 't011', moduleId: 'technical', text: 'Which Python decorator is used to define a class method that receives the class itself as the first argument?', options: ['@staticmethod', '@classmethod', '@property', '@abstractmethod'], correctIndex: 1, difficulty: 'medium', tags: ['python', 'oop'], language: 'python', points: 2 },
  { id: 't012', moduleId: 'technical', text: 'What is the output of `list(range(1, 10, 3))`?', options: ['[1, 4, 7]', '[1, 3, 6, 9]', '[1, 4, 7, 10]', '[3, 6, 9]'], correctIndex: 0, difficulty: 'easy', tags: ['python', 'ranges'], language: 'python', points: 1 },
  { id: 't013', moduleId: 'technical', text: 'Which Python data structure is immutable and ordered?', options: ['list', 'dict', 'tuple', 'set'], correctIndex: 2, difficulty: 'easy', tags: ['python', 'data-structures'], language: 'python', points: 1 },
  { id: 't014', moduleId: 'technical', text: 'What does the `*args` syntax in a Python function definition do?', options: ['Unpacks a dictionary', 'Collects positional arguments into a tuple', 'Creates keyword arguments', 'Defines default arguments'], correctIndex: 1, difficulty: 'medium', tags: ['python', 'functions'], language: 'python', points: 2 },
  { id: 't015', moduleId: 'technical', text: 'Which module provides support for coroutines and asynchronous I/O in Python?', options: ['threading', 'multiprocessing', 'asyncio', 'concurrent'], correctIndex: 2, difficulty: 'medium', tags: ['python', 'async'], language: 'python', points: 2 },
  { id: 't016', moduleId: 'technical', text: 'What is a Python generator expression?', options: ['A list comprehension with lambda', 'A lazy evaluated iterable using () syntax', 'A dictionary comprehension', 'A set comprehension'], correctIndex: 1, difficulty: 'medium', tags: ['python', 'generators'], language: 'python', points: 2 },
  { id: 't017', moduleId: 'technical', text: 'Which built-in Python function returns the largest item in an iterable?', options: ['maximum()', 'max()', 'largest()', 'top()'], correctIndex: 1, difficulty: 'easy', tags: ['python', 'builtins'], language: 'python', points: 1 },
  { id: 't018', moduleId: 'technical', text: 'What does `__init__` do in a Python class?', options: ['Destroys the object', 'Initializes a new instance', 'Defines class attributes only', 'Imports modules'], correctIndex: 1, difficulty: 'easy', tags: ['python', 'oop'], language: 'python', points: 1 },
  { id: 't019', moduleId: 'technical', text: 'Which of the following correctly creates a dictionary comprehension in Python?', options: ['{k: v for k, v in items}', '[k: v for k, v in items]', '(k: v for k, v in items)', '{k => v for k, v in items}'], correctIndex: 0, difficulty: 'medium', tags: ['python', 'comprehensions'], language: 'python', points: 2 },
  { id: 't020', moduleId: 'technical', text: 'What is the Global Interpreter Lock (GIL) in CPython?', options: ['A memory allocator', 'A mutex preventing multiple threads from executing Python bytecode simultaneously', 'A garbage collector', 'A JIT compiler'], correctIndex: 1, difficulty: 'hard', tags: ['python', 'concurrency', 'gil'], language: 'python', points: 3 },
  // Java
  { id: 't021', moduleId: 'technical', text: 'Which Java keyword prevents a class from being subclassed?', options: ['static', 'abstract', 'final', 'sealed'], correctIndex: 2, difficulty: 'easy', tags: ['java', 'oop'], language: 'java', points: 1 },
  { id: 't022', moduleId: 'technical', text: 'What is the difference between `==` and `.equals()` in Java?', options: ['No difference', '== compares references, .equals() compares values', '== compares values, .equals() compares references', '== is for primitives only'], correctIndex: 1, difficulty: 'medium', tags: ['java', 'comparison'], language: 'java', points: 2 },
  { id: 't023', moduleId: 'technical', text: 'Which collection interface in Java provides ordered, duplicate-free elements?', options: ['List', 'Set', 'Map', 'Queue'], correctIndex: 1, difficulty: 'easy', tags: ['java', 'collections'], language: 'java', points: 1 },
  { id: 't024', moduleId: 'technical', text: 'What does the `volatile` keyword ensure in Java multithreading?', options: ['Thread safety', 'Visibility of variable changes across threads', 'Atomic operations', 'Prevents deadlocks'], correctIndex: 1, difficulty: 'hard', tags: ['java', 'concurrency'], language: 'java', points: 3 },
  { id: 't025', moduleId: 'technical', text: 'Which Java 8 feature allows you to write functional interfaces inline?', options: ['Generics', 'Streams', 'Lambda expressions', 'Annotations'], correctIndex: 2, difficulty: 'medium', tags: ['java', 'lambdas'], language: 'java', points: 2 },
  { id: 't026', moduleId: 'technical', text: 'What is method overriding in Java?', options: ['Defining two methods with same name different parameters', 'A subclass provides a specific implementation of a superclass method', 'Calling a method with different arguments', 'Making a method static'], correctIndex: 1, difficulty: 'easy', tags: ['java', 'oop'], language: 'java', points: 1 },
  { id: 't027', moduleId: 'technical', text: 'Which Java interface must be implemented to use objects in a TreeSet?', options: ['Serializable', 'Cloneable', 'Comparable', 'Iterable'], correctIndex: 2, difficulty: 'medium', tags: ['java', 'collections'], language: 'java', points: 2 },
  { id: 't028', moduleId: 'technical', text: 'What is the purpose of `try-with-resources` in Java?', options: ['Handle multiple exceptions', 'Automatically close resources', 'Retry failed operations', 'Lock threads'], correctIndex: 1, difficulty: 'medium', tags: ['java', 'exceptions'], language: 'java', points: 2 },
  { id: 't029', moduleId: 'technical', text: 'Which Java Stream terminal operation returns an Optional?', options: ['map()', 'filter()', 'findFirst()', 'forEach()'], correctIndex: 2, difficulty: 'medium', tags: ['java', 'streams'], language: 'java', points: 2 },
  { id: 't030', moduleId: 'technical', text: 'What is the difference between ArrayList and LinkedList in Java?', options: ['No difference', 'ArrayList uses dynamic array, LinkedList uses doubly-linked list', 'LinkedList is faster for all operations', 'ArrayList cannot store duplicates'], correctIndex: 1, difficulty: 'medium', tags: ['java', 'data-structures'], language: 'java', points: 2 },
  // C/C++
  { id: 't031', moduleId: 'technical', text: 'What is a pointer in C/C++?', options: ['A variable that stores a memory address', 'A variable that stores a value', 'A function parameter', 'A type alias'], correctIndex: 0, difficulty: 'easy', tags: ['cpp', 'pointers'], language: 'cpp', points: 1 },
  { id: 't032', moduleId: 'technical', text: 'What does the `virtual` keyword enable in C++?', options: ['Static dispatch', 'Runtime polymorphism', 'Template specialization', 'Inline functions'], correctIndex: 1, difficulty: 'medium', tags: ['cpp', 'oop'], language: 'cpp', points: 2 },
  { id: 't033', moduleId: 'technical', text: 'Which smart pointer in C++11 maintains shared ownership of an object?', options: ['unique_ptr', 'shared_ptr', 'weak_ptr', 'auto_ptr'], correctIndex: 1, difficulty: 'medium', tags: ['cpp', 'memory'], language: 'cpp', points: 2 },
  { id: 't034', moduleId: 'technical', text: 'What is the output of `sizeof(int)` on most 64-bit systems?', options: ['2', '4', '8', '16'], correctIndex: 1, difficulty: 'easy', tags: ['cpp', 'types'], language: 'cpp', points: 1 },
  { id: 't035', moduleId: 'technical', text: 'Which C++ STL container provides O(1) average insert/lookup?', options: ['vector', 'map', 'unordered_map', 'list'], correctIndex: 2, difficulty: 'medium', tags: ['cpp', 'stl'], language: 'cpp', points: 2 },
  { id: 't036', moduleId: 'technical', text: 'What is RAII in C++?', options: ['Run-And-Iterate-Implementation', 'Resource Acquisition Is Initialization', 'Random Access In-memory Indexing', 'Recursive Algorithm Invocation Interface'], correctIndex: 1, difficulty: 'hard', tags: ['cpp', 'raii', 'memory'], language: 'cpp', points: 3 },
  { id: 't037', moduleId: 'technical', text: 'What does `const` at the end of a C++ member function declaration mean?', options: ['The function is static', 'The function does not modify the object', 'The return type is const', 'The function is inline'], correctIndex: 1, difficulty: 'medium', tags: ['cpp', 'const'], language: 'cpp', points: 2 },
  { id: 't038', moduleId: 'technical', text: 'Which operator is used to access members through a pointer in C++?', options: ['.', '::', '->', '&'], correctIndex: 2, difficulty: 'easy', tags: ['cpp', 'operators'], language: 'cpp', points: 1 },
  { id: 't039', moduleId: 'technical', text: 'What is a template in C++?', options: ['A design pattern', 'A way to write generic, type-independent code', 'A preprocessor macro', 'A class inheriting from abstract base'], correctIndex: 1, difficulty: 'medium', tags: ['cpp', 'templates'], language: 'cpp', points: 2 },
  { id: 't040', moduleId: 'technical', text: 'What is undefined behavior in C++?', options: ['Code that throws an exception', 'Code whose behavior the C++ standard imposes no requirements on', 'Code that fails to compile', 'Code that runs in debug mode only'], correctIndex: 1, difficulty: 'hard', tags: ['cpp', 'undefined-behavior'], language: 'cpp', points: 3 },
  // .NET / C#
  { id: 't041', moduleId: 'technical', text: 'What keyword in C# is used to define an asynchronous method?', options: ['task', 'await', 'async', 'parallel'], correctIndex: 2, difficulty: 'easy', tags: ['dotnet', 'async'], language: 'dotnet', points: 1 },
  { id: 't042', moduleId: 'technical', text: 'Which C# collection is thread-safe for concurrent read/write?', options: ['List<T>', 'Dictionary<K,V>', 'ConcurrentDictionary<K,V>', 'HashSet<T>'], correctIndex: 2, difficulty: 'medium', tags: ['dotnet', 'concurrency'], language: 'dotnet', points: 2 },
  { id: 't043', moduleId: 'technical', text: 'What is the difference between `struct` and `class` in C#?', options: ['No difference', 'Struct is a value type, class is a reference type', 'Struct supports inheritance, class does not', 'Class cannot have constructors'], correctIndex: 1, difficulty: 'medium', tags: ['dotnet', 'types'], language: 'dotnet', points: 2 },
  { id: 't044', moduleId: 'technical', text: 'What does LINQ stand for in .NET?', options: ['Local Integrated Numerical Queries', 'Language Integrated Query', 'Linked Indexed Node Queue', 'Local Interface for Net Queries'], correctIndex: 1, difficulty: 'easy', tags: ['dotnet', 'linq'], language: 'dotnet', points: 1 },
  { id: 't045', moduleId: 'technical', text: 'Which interface must be implemented to enable `foreach` iteration in C#?', options: ['IComparable', 'IDisposable', 'IEnumerable', 'ICollection'], correctIndex: 2, difficulty: 'medium', tags: ['dotnet', 'interfaces'], language: 'dotnet', points: 2 },
  { id: 't046', moduleId: 'technical', text: 'What is a delegate in C#?', options: ['An interface', 'A type-safe function pointer', 'A base class', 'An attribute'], correctIndex: 1, difficulty: 'medium', tags: ['dotnet', 'delegates'], language: 'dotnet', points: 2 },
  { id: 't047', moduleId: 'technical', text: 'What is the purpose of `using` statement in C#?', options: ['Import namespaces only', 'Ensure IDisposable objects are disposed', 'Both import namespaces and ensure disposal', 'Lock a critical section'], correctIndex: 2, difficulty: 'medium', tags: ['dotnet', 'memory'], language: 'dotnet', points: 2 },
  { id: 't048', moduleId: 'technical', text: 'Which .NET feature enables runtime inspection of types?', options: ['Generics', 'Reflection', 'Delegates', 'Attributes'], correctIndex: 1, difficulty: 'medium', tags: ['dotnet', 'reflection'], language: 'dotnet', points: 2 },
  { id: 't049', moduleId: 'technical', text: 'What does `sealed` keyword do to a C# class?', options: ['Makes it abstract', 'Prevents inheritance', 'Makes all members static', 'Prevents instantiation'], correctIndex: 1, difficulty: 'easy', tags: ['dotnet', 'oop'], language: 'dotnet', points: 1 },
  { id: 't050', moduleId: 'technical', text: 'Which C# pattern matching feature was introduced in C# 8.0?', options: ['is keyword', 'switch statement', 'Switch expressions', 'Type casting'], correctIndex: 2, difficulty: 'hard', tags: ['dotnet', 'pattern-matching'], language: 'dotnet', points: 3 },
  // Data Structures & Algorithms
  { id: 't051', moduleId: 'technical', text: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], correctIndex: 1, difficulty: 'easy', tags: ['algorithms', 'search'], points: 1 },
  { id: 't052', moduleId: 'technical', text: 'Which sorting algorithm has the best average-case time complexity?', options: ['Bubble Sort', 'Insertion Sort', 'Quick Sort', 'Merge Sort'], correctIndex: 3, difficulty: 'medium', tags: ['algorithms', 'sorting'], points: 2 },
  { id: 't053', moduleId: 'technical', text: 'What data structure is used to implement a LIFO (Last In First Out) structure?', options: ['Queue', 'Stack', 'Deque', 'Heap'], correctIndex: 1, difficulty: 'easy', tags: ['data-structures'], points: 1 },
  { id: 't054', moduleId: 'technical', text: 'Which tree traversal visits nodes in sorted order for a BST?', options: ['Pre-order', 'Post-order', 'In-order', 'Level-order'], correctIndex: 2, difficulty: 'medium', tags: ['data-structures', 'trees'], points: 2 },
  { id: 't055', moduleId: 'technical', text: 'What is the space complexity of Merge Sort?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correctIndex: 2, difficulty: 'medium', tags: ['algorithms', 'sorting'], points: 2 },
  { id: 't056', moduleId: 'technical', text: 'What is a hash collision?', options: ['Two keys mapped to the same hash value', 'A hash function that returns null', 'An overflow in hash table capacity', 'A recursive hash function call'], correctIndex: 0, difficulty: 'medium', tags: ['data-structures', 'hashing'], points: 2 },
  { id: 't057', moduleId: 'technical', text: 'Which graph algorithm finds the shortest path in a weighted graph?', options: ['BFS', 'DFS', "Dijkstra's Algorithm", 'Topological Sort'], correctIndex: 2, difficulty: 'medium', tags: ['algorithms', 'graphs'], points: 2 },
  { id: 't058', moduleId: 'technical', text: 'What is dynamic programming primarily used for?', options: ['Parallel computing', 'Optimizing overlapping subproblems', 'Memory management', 'Sorting algorithms'], correctIndex: 1, difficulty: 'hard', tags: ['algorithms', 'dp'], points: 3 },
  { id: 't059', moduleId: 'technical', text: 'What is the height of a balanced binary tree with n nodes?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correctIndex: 1, difficulty: 'medium', tags: ['data-structures', 'trees'], points: 2 },
  { id: 't060', moduleId: 'technical', text: 'Which data structure supports amortized O(1) push and pop operations?', options: ['Linked List', 'Dynamic Array (Stack)', 'Binary Tree', 'Hash Map'], correctIndex: 1, difficulty: 'medium', tags: ['data-structures'], points: 2 },
  // System Design & Architecture
  { id: 't061', moduleId: 'technical', text: 'What does REST stand for in web APIs?', options: ['Remote Execution State Transfer', 'Representational State Transfer', 'Request-Encoded Service Transport', 'Rapid End-to-end Service Transmission'], correctIndex: 1, difficulty: 'easy', tags: ['system-design', 'api'], points: 1 },
  { id: 't062', moduleId: 'technical', text: 'What is a microservices architecture?', options: ['A monolithic application split into files', 'An architectural style where applications are built as small independent services', 'A database partitioning strategy', 'A frontend framework pattern'], correctIndex: 1, difficulty: 'medium', tags: ['system-design', 'architecture'], points: 2 },
  { id: 't063', moduleId: 'technical', text: 'Which HTTP method is idempotent and used to update a resource completely?', options: ['POST', 'PATCH', 'PUT', 'GET'], correctIndex: 2, difficulty: 'medium', tags: ['api', 'http'], points: 2 },
  { id: 't064', moduleId: 'technical', text: 'What is horizontal scaling?', options: ['Upgrading a single server', 'Adding more servers to distribute load', 'Increasing CPU clock speed', 'Adding more RAM to existing servers'], correctIndex: 1, difficulty: 'easy', tags: ['system-design', 'scaling'], points: 1 },
  { id: 't065', moduleId: 'technical', text: 'What is the CAP theorem in distributed systems?', options: ['A security protocol', 'States that a distributed system can only guarantee 2 of: Consistency, Availability, Partition tolerance', 'A caching strategy', 'A load balancing algorithm'], correctIndex: 1, difficulty: 'hard', tags: ['system-design', 'distributed'], points: 3 },
  { id: 't066', moduleId: 'technical', text: 'What is a CDN (Content Delivery Network)?', options: ['A database replication strategy', 'A network of geographically distributed servers that deliver content to users based on location', 'A load balancer', 'A DNS service'], correctIndex: 1, difficulty: 'easy', tags: ['system-design', 'networking'], points: 1 },
  { id: 't067', moduleId: 'technical', text: 'What is the purpose of a message queue in distributed systems?', options: ['Store data permanently', 'Decouple producers and consumers, enabling async communication', 'Provide caching', 'Handle authentication'], correctIndex: 1, difficulty: 'medium', tags: ['system-design', 'messaging'], points: 2 },
  { id: 't068', moduleId: 'technical', text: 'What is database sharding?', options: ['Replicating a database', 'Partitioning data across multiple database instances', 'Indexing strategy', 'Backup methodology'], correctIndex: 1, difficulty: 'hard', tags: ['system-design', 'databases'], points: 3 },
  { id: 't069', moduleId: 'technical', text: 'What is JWT (JSON Web Token) used for?', options: ['Encrypting database records', 'Stateless authentication and authorization', 'Data serialization', 'API rate limiting'], correctIndex: 1, difficulty: 'medium', tags: ['security', 'auth'], points: 2 },
  { id: 't070', moduleId: 'technical', text: 'What is a race condition?', options: ['A performance benchmark', 'A situation where the outcome depends on the relative timing of events', 'A deadlock condition', 'A memory leak pattern'], correctIndex: 1, difficulty: 'hard', tags: ['concurrency', 'bugs'], points: 3 },
  // Databases
  { id: 't071', moduleId: 'technical', text: 'What does ACID stand for in database transactions?', options: ['Atomicity, Consistency, Isolation, Durability', 'Automated, Cached, Indexed, Distributed', 'Absolute, Complete, Integral, Durable', 'Atomic, Consistent, Independent, Distributed'], correctIndex: 0, difficulty: 'medium', tags: ['databases', 'transactions'], points: 2 },
  { id: 't072', moduleId: 'technical', text: 'Which SQL join returns all records from the left table and matched records from the right?', options: ['INNER JOIN', 'RIGHT JOIN', 'LEFT JOIN', 'FULL JOIN'], correctIndex: 2, difficulty: 'easy', tags: ['sql', 'joins'], points: 1 },
  { id: 't073', moduleId: 'technical', text: 'What is database normalization?', options: ['Speeding up queries', 'Organizing data to reduce redundancy and improve integrity', 'Creating indexes', 'Backing up data'], correctIndex: 1, difficulty: 'medium', tags: ['databases', 'normalization'], points: 2 },
  { id: 't074', moduleId: 'technical', text: 'What is an index in a database?', options: ['A table backup', 'A data structure that improves query performance', 'A foreign key constraint', 'A stored procedure'], correctIndex: 1, difficulty: 'easy', tags: ['databases', 'indexes'], points: 1 },
  { id: 't075', moduleId: 'technical', text: 'Which NoSQL database is a document store?', options: ['Redis', 'Cassandra', 'MongoDB', 'Neo4j'], correctIndex: 2, difficulty: 'easy', tags: ['nosql', 'databases'], points: 1 },
  { id: 't076', moduleId: 'technical', text: 'What is the N+1 query problem in ORM?', options: ['Too many database connections', 'Executing N additional queries for N records in a result set', 'Exceeding query timeout', 'Circular foreign key references'], correctIndex: 1, difficulty: 'hard', tags: ['databases', 'orm'], points: 3 },
  { id: 't077', moduleId: 'technical', text: 'What does a GROUP BY clause do in SQL?', options: ['Sorts results', 'Groups rows sharing a property to apply aggregate functions', 'Filters rows', 'Joins tables'], correctIndex: 1, difficulty: 'easy', tags: ['sql', 'aggregation'], points: 1 },
  { id: 't078', moduleId: 'technical', text: 'What is a stored procedure in SQL?', options: ['A cached query plan', 'A precompiled collection of SQL statements stored in the database', 'An index type', 'A trigger function'], correctIndex: 1, difficulty: 'medium', tags: ['sql', 'stored-procedures'], points: 2 },
  { id: 't079', moduleId: 'technical', text: 'What is eventual consistency in distributed databases?', options: ['Data is always consistent', 'All replicas will converge to the same value given no new updates', 'Transactions are atomic', 'Queries always return latest data'], correctIndex: 1, difficulty: 'hard', tags: ['databases', 'distributed'], points: 3 },
  { id: 't080', moduleId: 'technical', text: 'Which isolation level prevents dirty reads but allows non-repeatable reads?', options: ['Read Uncommitted', 'Read Committed', 'Repeatable Read', 'Serializable'], correctIndex: 1, difficulty: 'hard', tags: ['databases', 'transactions'], points: 3 },
  // Security & DevOps
  { id: 't081', moduleId: 'technical', text: 'What is SQL injection?', options: ['A SQL optimization technique', 'An attack inserting malicious SQL code into queries', 'A database migration method', 'A stored procedure type'], correctIndex: 1, difficulty: 'easy', tags: ['security', 'sql-injection'], points: 1 },
  { id: 't082', moduleId: 'technical', text: 'What is XSS (Cross-Site Scripting)?', options: ['A CSS methodology', 'An attack injecting malicious scripts into web pages viewed by other users', 'A server-side rendering technique', 'A browser security feature'], correctIndex: 1, difficulty: 'medium', tags: ['security', 'xss'], points: 2 },
  { id: 't083', moduleId: 'technical', text: 'What is the purpose of HTTPS?', options: ['Faster HTTP', 'Encrypted HTTP communication using TLS/SSL', 'HTTP version 2', 'Compressed HTTP'], correctIndex: 1, difficulty: 'easy', tags: ['security', 'networking'], points: 1 },
  { id: 't084', moduleId: 'technical', text: 'What is Docker used for?', options: ['Version control', 'Containerizing applications for consistent deployment', 'Load balancing', 'Database management'], correctIndex: 1, difficulty: 'easy', tags: ['devops', 'containers'], points: 1 },
  { id: 't085', moduleId: 'technical', text: 'What is CI/CD?', options: ['Code Inspection/Code Deployment', 'Continuous Integration/Continuous Delivery (or Deployment)', 'Client Interface/Client Data', 'Core Infrastructure/Cloud Deployment'], correctIndex: 1, difficulty: 'easy', tags: ['devops', 'cicd'], points: 1 },
  { id: 't086', moduleId: 'technical', text: 'What is Kubernetes used for?', options: ['Container orchestration and management', 'Database clustering', 'Network monitoring', 'Code compilation'], correctIndex: 0, difficulty: 'medium', tags: ['devops', 'kubernetes'], points: 2 },
  { id: 't087', moduleId: 'technical', text: 'What is a CSRF attack?', options: ['Cache Storage Request Failure', 'Cross-Site Request Forgery — tricks users into submitting requests', 'Client-Side Rendering Framework', 'Content Security Response Filter'], correctIndex: 1, difficulty: 'medium', tags: ['security', 'csrf'], points: 2 },
  { id: 't088', moduleId: 'technical', text: 'What is bcrypt used for?', options: ['Encryption', 'Secure password hashing', 'Data compression', 'Token generation'], correctIndex: 1, difficulty: 'medium', tags: ['security', 'hashing'], points: 2 },
  { id: 't089', moduleId: 'technical', text: 'What is a load balancer?', options: ['A server that stores static files', 'A system that distributes network traffic across multiple servers', 'A database replication tool', 'A code profiler'], correctIndex: 1, difficulty: 'easy', tags: ['devops', 'networking'], points: 1 },
  { id: 't090', moduleId: 'technical', text: 'What is OAuth 2.0 used for?', options: ['Password encryption', 'Authorization delegation allowing third-party apps limited resource access', 'Two-factor authentication', 'API rate limiting'], correctIndex: 1, difficulty: 'medium', tags: ['security', 'oauth'], points: 2 },
  // Web / Networking
  { id: 't091', moduleId: 'technical', text: 'What is the difference between TCP and UDP?', options: ['No difference', 'TCP is reliable with handshake; UDP is faster but unreliable', 'UDP is reliable; TCP is not', 'TCP is for UDP is for video only'], correctIndex: 1, difficulty: 'medium', tags: ['networking', 'protocols'], points: 2 },
  { id: 't092', moduleId: 'technical', text: 'What HTTP status code indicates "Not Found"?', options: ['200', '301', '404', '500'], correctIndex: 2, difficulty: 'easy', tags: ['http', 'web'], points: 1 },
  { id: 't093', moduleId: 'technical', text: 'What is WebSocket used for?', options: ['One-way server push', 'Full-duplex communication over a single persistent connection', 'HTTP/2 multiplexing', 'Static content delivery'], correctIndex: 1, difficulty: 'medium', tags: ['networking', 'websocket'], points: 2 },
  { id: 't094', moduleId: 'technical', text: 'What is DNS?', options: ['Domain Name System — translates domain names to IP addresses', 'Dynamic Network Service', 'Distributed Node Server', 'Data Network Standard'], correctIndex: 0, difficulty: 'easy', tags: ['networking', 'dns'], points: 1 },
  { id: 't095', moduleId: 'technical', text: 'What is GraphQL?', options: ['A graph database', 'A query language for APIs providing exactly the data requested', 'A JavaScript framework', 'A SQL extension'], correctIndex: 1, difficulty: 'medium', tags: ['api', 'graphql'], points: 2 },
  { id: 't096', moduleId: 'technical', text: 'What is the Same-Origin Policy in web browsers?', options: ['Scripts on one origin can freely access any other origin', 'A security mechanism restricting how documents/scripts from one origin interact with another', 'A CDN caching policy', 'A cookie sharing standard'], correctIndex: 1, difficulty: 'hard', tags: ['security', 'web'], points: 3 },
  { id: 't097', moduleId: 'technical', text: 'What does the HTTP 429 status code mean?', options: ['Unauthorized', 'Not Found', 'Too Many Requests', 'Internal Server Error'], correctIndex: 2, difficulty: 'medium', tags: ['http', 'api'], points: 2 },
  { id: 't098', moduleId: 'technical', text: 'What is server-side rendering (SSR)?', options: ['Rendering HTML on the client browser', 'Rendering HTML on the server before sending to client', 'Static site generation', 'Edge computing'], correctIndex: 1, difficulty: 'medium', tags: ['web', 'rendering'], points: 2 },
  { id: 't099', moduleId: 'technical', text: 'What is a race condition in the context of web APIs?', options: ['A performance optimization', 'When multiple concurrent requests produce inconsistent results due to timing', 'A caching strategy', 'An API versioning issue'], correctIndex: 1, difficulty: 'hard', tags: ['api', 'concurrency'], points: 3 },
  { id: 't100', moduleId: 'technical', text: 'What is the purpose of CORS (Cross-Origin Resource Sharing)?', options: ['Prevent all cross-origin requests', 'Allow servers to specify which origins can access resources', 'Encrypt cross-origin data', 'Cache cross-origin responses'], correctIndex: 1, difficulty: 'medium', tags: ['security', 'web', 'cors'], points: 2 },
];

// ── ATTITUDE (100 questions) ───────────────────────────────────────────────
const attitudeQuestions: Question[] = Array.from({ length: 100 }, (_, i) => {
  const pool = [
    { text: 'When faced with a challenging project deadline, you typically:', options: ['Panic and ask for an extension immediately', 'Create a structured plan and communicate proactively with stakeholders', 'Work silently without informing anyone', 'Delegate all tasks regardless of team capacity'], correctIndex: 1, difficulty: 'easy' as const },
    { text: 'A colleague presents an idea you believe is flawed. You:', options: ['Dismiss it publicly in the meeting', 'Listen fully, then offer constructive alternative perspectives privately', 'Remain silent to avoid conflict', 'Implement it without question'], correctIndex: 1, difficulty: 'medium' as const },
    { text: 'When you make a significant error at work, you:', options: ['Blame external factors', 'Acknowledge it, learn from it, and implement corrective measures', 'Minimize it and hope no one notices', 'Immediately resign'], correctIndex: 1, difficulty: 'easy' as const },
    { text: 'How do you approach learning new technologies relevant to your role?', options: ['Wait until forced to learn them', 'Proactively seek out learning opportunities and apply them', 'Learn only what is absolutely required', 'Ask others to do tasks requiring new tech'], correctIndex: 1, difficulty: 'easy' as const },
    { text: 'When a team member underperforms, you:', options: ['Report them to management immediately', 'Offer support, understand root causes, and provide guidance', 'Do their work for them indefinitely', 'Ignore the situation'], correctIndex: 1, difficulty: 'medium' as const },
    { text: 'You receive critical feedback from your manager. Your first reaction is to:', options: ['Become defensive and argue', 'Listen carefully, ask clarifying questions, and reflect on it', 'Dismiss it as unfair', 'Immediately apologize without understanding the feedback'], correctIndex: 1, difficulty: 'easy' as const },
    { text: 'When organizational priorities change unexpectedly, you:', options: ['Resist the change strongly', 'Adapt your approach while maintaining focus on key objectives', 'Become disengaged from work', 'Complain to colleagues about leadership decisions'], correctIndex: 1, difficulty: 'medium' as const },
    { text: 'How do you handle competing priorities from multiple stakeholders?', options: ['Ignore lower-ranking stakeholders', 'Transparently communicate tradeoffs and negotiate based on business impact', 'Do all tasks simultaneously regardless of quality', 'Always prioritize the most recent request'], correctIndex: 1, difficulty: 'hard' as const },
    { text: 'When you disagree with a company policy, you:', options: ['Violate the policy quietly', 'Voice your concerns through appropriate channels while complying', 'Encourage others to ignore the policy', 'Immediately leave the organization'], correctIndex: 1, difficulty: 'medium' as const },
    { text: 'How do you maintain work quality when under significant stress?', options: ['Quality becomes secondary to speed', 'Use structured approaches and self-management techniques to maintain standards', 'Ask for indefinite deadline extensions', 'Submit incomplete work'], correctIndex: 1, difficulty: 'hard' as const },
  ];
  const q = pool[i % pool.length];
  return {
    id: `a${String(i + 1).padStart(3, '0')}` as string,
    moduleId: 'attitude' as const,
    text: q.text,
    options: q.options,
    correctIndex: q.correctIndex,
    difficulty: q.difficulty,
    tags: ['attitude', 'professional'],
    points: q.difficulty === 'hard' ? 3 : q.difficulty === 'medium' ? 2 : 1,
  };
});

// ── BEHAVIORAL (100 questions) ─────────────────────────────────────────────
const behavioralQuestions: Question[] = Array.from({ length: 100 }, (_, i) => {
  const pool = [
    { text: 'Describe how you handled a situation where you had to meet a tight deadline with limited resources.', options: ['I prioritized tasks and collaborated with team members to deliver key requirements on time', 'I worked overtime alone without communicating with anyone', 'I submitted incomplete work and apologized', 'I asked for a large extension without trying alternatives'], correctIndex: 0, difficulty: 'medium' as const },
    { text: 'Tell me about a time you had to work with a difficult team member.', options: ['I avoided them for the duration of the project', 'I sought to understand their perspective and found common ground', 'I complained to management immediately', 'I let their behavior affect my performance'], correctIndex: 1, difficulty: 'medium' as const },
    { text: 'Give an example of a situation where you showed initiative beyond your job description.', options: ['I never do work beyond my job description', 'I identified a process inefficiency and proposed/implemented a solution', 'I waited for explicit instructions before doing anything extra', 'I took credit for a colleague\'s initiative'], correctIndex: 1, difficulty: 'easy' as const },
    { text: 'Describe a time you failed at something professionally. What happened?', options: ['I blamed external factors entirely', 'I took ownership, analyzed what went wrong, and applied lessons learned', 'I denied the failure occurred', 'I switched jobs to avoid the issue'], correctIndex: 1, difficulty: 'hard' as const },
    { text: 'How have you handled receiving negative feedback from a senior leader?', options: ['I argued against the feedback', 'I listened, sought to understand the perspective, and used it to improve', 'I became resentful and disengaged', 'I ignored it and continued as before'], correctIndex: 1, difficulty: 'medium' as const },
    { text: 'Describe a time you had to adapt your communication style for a specific audience.', options: ['I use the same communication style for everyone', 'I assessed the audience\'s technical level and adjusted my language and depth accordingly', 'I only communicate in one way that works for me', 'I delegated all communication to someone else'], correctIndex: 1, difficulty: 'medium' as const },
    { text: 'Tell me about a time you influenced others without having formal authority.', options: ['I threatened colleagues to comply', 'I built relationships, demonstrated expertise, and aligned my proposal to their interests', 'I went over everyone\'s heads to management', 'I never tried to influence others without authority'], correctIndex: 1, difficulty: 'hard' as const },
    { text: 'Describe how you prioritized when multiple urgent tasks competed for your time.', options: ['I worked on the most interesting task regardless of priority', 'I assessed business impact, communicated tradeoffs, and systematically addressed priorities', 'I completed tasks in the order received regardless of urgency', 'I refused to handle multiple priorities simultaneously'], correctIndex: 1, difficulty: 'medium' as const },
    { text: 'Tell me about a situation where you had to make a decision with incomplete information.', options: ['I always wait for complete information before deciding', 'I gathered what data was available, assessed risks, and made a reasoned decision while remaining adaptable', 'I always delegated such decisions upward', 'I made random decisions when information was incomplete'], correctIndex: 1, difficulty: 'hard' as const },
    { text: 'Describe a time you helped a struggling colleague improve their performance.', options: ['I reported them to HR', 'I offered mentoring, shared resources, and provided constructive feedback', 'I took over their responsibilities entirely', 'I ignored their struggles to focus on my own work'], correctIndex: 1, difficulty: 'easy' as const },
  ];
  const q = pool[i % pool.length];
  return {
    id: `b${String(i + 1).padStart(3, '0')}` as string,
    moduleId: 'behavioral' as const,
    text: q.text,
    options: q.options,
    correctIndex: q.correctIndex,
    difficulty: q.difficulty,
    tags: ['behavioral', 'STAR'],
    points: q.difficulty === 'hard' ? 3 : q.difficulty === 'medium' ? 2 : 1,
  };
});

// ── PSYCHOMETRIC (100 questions) ───────────────────────────────────────────
const psychometricQuestions: Question[] = Array.from({ length: 100 }, (_, i) => {
  const pool = [
    { text: 'Complete the sequence: 2, 6, 12, 20, 30, ___', options: ['38', '40', '42', '44'], correctIndex: 2, difficulty: 'medium' as const },
    { text: 'If all Bloops are Razzles and all Razzles are Lazzles, then all Bloops are definitely:', options: ['Not Lazzles', 'Lazzles', 'Only sometimes Lazzles', 'Neither Lazzles nor Razzles'], correctIndex: 1, difficulty: 'easy' as const },
    { text: 'A clock shows 3:15. What is the angle between the hour and minute hands?', options: ['0°', '7.5°', '15°', '22.5°'], correctIndex: 1, difficulty: 'hard' as const },
    { text: 'Which number is the odd one out: 2, 3, 5, 7, 9, 11, 13?', options: ['2', '9', '11', '13'], correctIndex: 1, difficulty: 'easy' as const },
    { text: 'If you rearrange the letters "CIFAIPC" you get the name of:', options: ['An ocean', 'A mountain', 'A country', 'A city'], correctIndex: 0, difficulty: 'medium' as const },
    { text: 'A train travels 60 km in 45 minutes. What is its speed in km/h?', options: ['60', '70', '75', '80'], correctIndex: 3, difficulty: 'medium' as const },
    { text: 'In a group of 30, 18 like coffee and 12 like tea. 5 like both. How many like neither?', options: ['3', '5', '7', '10'], correctIndex: 1, difficulty: 'hard' as const },
    { text: 'Which shape completes the pattern? [Circle, Triangle, Square] → [?, Triangle, Circle]', options: ['Circle', 'Square', 'Triangle', 'Pentagon'], correctIndex: 1, difficulty: 'easy' as const },
    { text: 'If 5 machines make 5 widgets in 5 minutes, how long does it take 100 machines to make 100 widgets?', options: ['1 minute', '5 minutes', '100 minutes', '20 minutes'], correctIndex: 1, difficulty: 'hard' as const },
    { text: 'What comes next in the pattern: A1, B3, C6, D10, ___?', options: ['E14', 'E15', 'F15', 'E16'], correctIndex: 1, difficulty: 'medium' as const },
  ];
  const q = pool[i % pool.length];
  return {
    id: `p${String(i + 1).padStart(3, '0')}` as string,
    moduleId: 'psychometric' as const,
    text: q.text,
    options: q.options,
    correctIndex: q.correctIndex,
    difficulty: q.difficulty,
    tags: ['psychometric', 'aptitude', 'reasoning'],
    points: q.difficulty === 'hard' ? 3 : q.difficulty === 'medium' ? 2 : 1,
  };
});

// ── COMMUNICATION (100 questions) ──────────────────────────────────────────
const communicationQuestions: Question[] = Array.from({ length: 100 }, (_, i) => {
  const pool = [
    { text: 'When presenting complex technical information to a non-technical audience, the most effective approach is:', options: ['Use all technical terms to sound credible', 'Use analogies, visuals, and simple language aligned with audience knowledge', 'Avoid eye contact to concentrate on content', 'Read from slides verbatim'], correctIndex: 1, difficulty: 'easy' as const },
    { text: 'Active listening primarily involves:', options: ['Formulating your response while the other person speaks', 'Paying full attention, understanding, and responding thoughtfully', 'Nodding continuously regardless of comprehension', 'Interrupting to show engagement'], correctIndex: 1, difficulty: 'easy' as const },
    { text: 'Which communication style is most effective in a professional conflict resolution?', options: ['Aggressive — assert your view forcefully', 'Assertive — express your needs clearly while respecting others\'', 'Passive — agree to avoid conflict', 'Passive-aggressive — comply externally but undermine covertly'], correctIndex: 1, difficulty: 'medium' as const },
    { text: 'A well-structured business email should:', options: ['Be as long as possible to cover all details', 'Have a clear subject, concise body, and specific call-to-action', 'Use informal language to seem friendly', 'Avoid stating the purpose upfront'], correctIndex: 1, difficulty: 'easy' as const },
    { text: 'Non-verbal communication accounts for approximately what percentage of communication impact?', options: ['10%', '30%', '55%', '90%'], correctIndex: 2, difficulty: 'medium' as const },
    { text: 'When you disagree with a point in a meeting, the best approach is:', options: ['Stay silent to maintain harmony', 'Acknowledge the point, then present your perspective with evidence', 'Interrupt immediately to correct the person', 'Send a harsh email after the meeting'], correctIndex: 1, difficulty: 'medium' as const },
    { text: 'What is the primary purpose of an executive summary in a business report?', options: ['Replace the entire report for busy readers', 'Provide key findings and recommendations for quick decision-making', 'List all data sources', 'Serve as a table of contents'], correctIndex: 1, difficulty: 'hard' as const },
    { text: 'Emotional intelligence in communication involves:', options: ['Suppressing emotions completely', 'Recognizing, understanding, and managing your emotions and others\'', 'Showing extreme empathy for everything', 'Avoiding emotional topics entirely'], correctIndex: 1, difficulty: 'medium' as const },
    { text: 'When giving constructive feedback, it is most effective to:', options: ['Focus only on what went wrong', 'Balance specific observations on behavior with its impact and suggestions for improvement', 'Compare unfavorably to top performers', 'Give feedback only during annual reviews'], correctIndex: 1, difficulty: 'medium' as const },
    { text: 'Cross-cultural communication competence requires:', options: ['Imposing your own cultural norms', 'Awareness of cultural differences and adapting communication accordingly', 'Speaking slower and louder for non-native speakers', 'Avoiding direct communication with different cultures'], correctIndex: 1, difficulty: 'hard' as const },
  ];
  const q = pool[i % pool.length];
  return {
    id: `c${String(i + 1).padStart(3, '0')}` as string,
    moduleId: 'communication' as const,
    text: q.text,
    options: q.options,
    correctIndex: q.correctIndex,
    difficulty: q.difficulty,
    tags: ['communication', 'soft-skills'],
    points: q.difficulty === 'hard' ? 3 : q.difficulty === 'medium' ? 2 : 1,
  };
});

export const allQuestions: Question[] = [
  ...technicalQuestions,
  ...attitudeQuestions,
  ...behavioralQuestions,
  ...psychometricQuestions,
  ...communicationQuestions,
];

export const getQuestionsByModule = (moduleId: string) =>
  allQuestions.filter(q => q.moduleId === moduleId);

export const getRandomQuestions = (moduleId: string, count: number): Question[] => {
  const pool = getQuestionsByModule(moduleId);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};
