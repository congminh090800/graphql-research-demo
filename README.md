# **Tài liệu nghiên cứu Apollo GraphQL**

> ### _Phần code và tài liệu của repo này chứa các thông tin tìm hiểu của team về Apollo GraphQL_

<br>

## **Thành viên**

| Họ và tên         | MSSV     | Email                    | \*     |
| ----------------- | -------- | ------------------------ | ------ |
| Lê Phan Công Minh | 18120463 | congminh090800@gmail.com | leader |
| Trần Đại Nghĩa    | 18120480 | mising                   |
| Nguyễn Khắc Luân  | 18120457 | missing                  |

## **Giới thiệu**

GraphQL là ngôn ngữ truy vấn và thao tác với các API, gồm các đặc điểm sau:  
- Cho phép client tùy chỉnh luồng dữ liêu trả về đúng với những gì họ cần
- GraphQL cho phép tổng hợp dữ liệu từ nhiều bộ dữ liệu khác nhau trong một request duy nhất
- GraphQL tổ chức dữ liệu theo type thay vì endpoint  

![picture1](./document-assets/graphql_introduction.png)
![picture2](./document-assets/graphql_introduction_2.png)

## **Apollo Server**

Apollo Server là một open-source xây dựng dựa trên nền tảng GraphQL Server có thể tích hợp với bất kì GraphQL client nào

Apollo Server có thể được sử dụng như một server riêng biệt hoặc một add-on bên trong một server truyền thống khác

### **Để chạy server demo**  
```bash
> cd server
> npm install
> nodemon
```

## 1. Schema
GraphQL cung cấp cho ta một loại ngôn ngữ định nghĩa schema - **schema definition language (or SDL)** khá tương tự với các database schema.

> Khai báo kiểu dữ liệu với cặp `[]` để đánh dấu trường này là một danh sách  

> Nullability: khai báo với hậu tố là `!` để đánh dấu trường này là bắt buộc

5 kiểu dữ liệu trong graphql:
* Scalar:
  * Int: A signed 32‐bit integer  
  * Float: A signed double-precision floating-point value
  * String: A UTF‐8 character sequence
  * Boolean: true or false
  * ID (serialized as a String): A unique identifier that's often used to refetch an object or as the key for a cache. Although it's serialized as a String, an ID is not intended to be human‐readable.
* Object: bao gồm cả các type đặc biệt như Query, Mutation, Subscription
  * trường `__typename`: tự động thêm vào cho biết type của object
  * Query: type đặc biệt nơi khai báo các entrypoint cho các hành động đọc dữ liệu
  * Mutation: type đặc biệt định nghĩa các entrypoint cho các hành động ghi dữ liệu
  * Subscription: type đặc biệt thông báo mỗi khi server thực hiện hành động được đặt subscription trước đó
* Input: cấu trúc giống object type giúp client cung cấp các data
* Enum: các giá trị của object được định nghĩa sẵn trong schema
* Union and Interface
  * Union: kết hợp 2 schema lại 
  * Interface: OOP reference

Ví dụ:  
```javascript
const typeDefs = gql`
    type Student {
        id: Int
        class: Class
        email: String
        password: String
        name: String
    }

    type Teacher {
        id: Int
        email: String
        password: String
        name: String
    }
    
    type Class {
        id: Int
        name: String
        formTeacher: Teacher
        students: [Student]
    }

    input AddStudent {
        email: String
        password: String
        name: String
        classId: Int
    }
    
    input AddClass {
        name: String
        formTeacherID: Int
    }
    
    type Query {
        students: [Student]
        teachers: [Teacher]
        classes: [Class]
    }
    
    type Mutation {
        addClass(name: String, formTeacher: Int): Class
    }
`;
```
- ### Custom scalar type
```javascript
const { GraphQLScalarType, Kind } = require('graphql');

const dateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type',
  serialize(value) {
    return value.getTime(); // Convert outgoing Date to integer for JSON
  },
  parseValue(value) {
    return new Date(value); // Convert incoming integer to Date
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10)); // Convert hard-coded AST string to integer and then to Date
    }
    return null; // Invalid hard-coded value (not an integer)
  },
});
```

## 2. Resolvers
Trước hết, Apollo Server cần biết cách populate data từng field trong từng schema của chúng ta để có thể phản hồi data bất kể "độ sâu" câu truy vấn của bạn là bao nhiêu. Đây là một điểm rất mạnh của graphQL  
Trong ví dụ ta có câu truy vấn sau:  
```
query {
  classes {
    students {
      class {
        students {
          name
        }
      }
    }
  }
}
```
Có kết quả:  
```json
{
  "data": {
    "classes": [
      {
        "students": [
          {
            "class": {
              "students": [
                {
                  "name": "Acc asklj alsk"
                },
                {
                  "name": "hnim laskdja as"
                }
              ]
            }
          },
          {
            "class": {
              "students": [
                {
                  "name": "Acc asklj alsk"
                },
                {
                  "name": "hnim laskdja as"
                }
              ]
            }
          }
        ]
      },
      {
        "students": [
          {
            "class": {
              "students": [
                {
                  "name": "Le Phan Cong Minh"
                }
              ]
            }
          }
        ]
      },
      {
        "students": []
      },
      {
        "students": []
      }
    ]
  }
}
```
Nhờ resolvers, ta có thể truy vấn một cách "đệ qui" như thế, có thể nói đây là nơi ma thuật xảy ra. Bằng cách khao báo cách populate data cho từng field có type là object nên việc truy vấn với độ sâu lớn không còn là vấn đề  
> Note: Resolvers cũng hỗ trợ async/await
### Implementation
```javascript
const resolvers = {
    Student: {
        class:  ({ classId }, args, { models }) => {
            const cl = classes.find(ele => ele.id === classId);
            if (!cl) {
                return null;
            }
            return cl; 
        }
    },
    Class: {
        formTeacher: ({ formTeacherId }, args, { models }) => {
            const teacher = teachers.find(ele => ele.id === formTeacherId);
            if (!teacher) {
                return null;
            }
            return teacher;
        },
        students: ( parent, args, { models }) => {
            const student = students.filter(student => parent.students.includes(student.id));
            return student;
        }
    },
    Query: {
        students: () => students,
        teachers: () => teachers,
        classes: () => classes,
    },
    Mutation: {
        addClass: (parent, args, { models }) => {
            classes.push({
                id: classes.length + 1,
                name: args.name,
                formTeacherId: args.formTeacher,
                students: []
            });
            return classes[classes.length - 1];
        }
    }
};
```
### Các tham số của một resolver
| Tham số | Mô tả |
| -----   | ----- |
| `parent` | Chính là object đang được resolver xử lý |
| `args` | Tham số được truyền vào |
| `context` | Một tham số đặc biệt được tạo ra trong mỗi request,  nội dung của context phụ thuộc vào cài đặt của chúng ta |
| `info` | Chứa hầu hết các thông tin hiện tại liên quan đến resolver này |

### Simple search example
```
input SearchStudent {
    name: String
    limit: Int!
    offset: Int!
}
```

```javascript
someStudents: (_, args) => {
    let {name, offset, limit} = args.input;
    let data = students;
    if (name) {
        data = students.filter(s => s.name.toUpperCase().includes(name.toUpperCase()));
    }
    return data.slice(offset, offset + limit);
},
```

### Error handling
GraphQL build sẵn một số Error Object để ta sử dụng, ngoài ra ta có thể custom error bằng cách extend class ApolloError.

```javascript
addClass: (parent, args) => {
  if (!args.name) {
      throw new UserInputError("Name is required", {
          error: "Some thing that u like to put in"
      })
  }
  classes.push({
      id: classes.length + 1,
      name: args.name,
      formTeacherId: args.formTeacher,
      students: []
  });
  return classes[classes.length - 1];
}
```
> Tham khảo: <https://www.apollographql.com/docs/apollo-server/data/errors/>

Khi ta cần che giấu các lỗi của server để bảo mật thông tin ta có thể sử dụng thuộc tính formatError của Apollo Server
```javascript
const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (err) => {
    // Don't give the specific errors to the client.
    if (err.message.startsWith('Database Error: ')) {
      return new Error('Internal server error');
    }
    // Otherwise return the original error. The error can also
    // be manipulated in other ways, as long as it's returned.
    return err;
  },
});
```


### Caching
GraphQL mặc định sử dụng in-memory-cache chúng ta có thể sử dụng redis như một biện pháp thay thế, nhưng trọng tâm của document này không phải là về redis nên nhóm xin không trình bày ở đây  
> Tham khảo: <https://www.apollographql.com/docs/apollo-server/data/data-sources/>

Ta có thể sử dụng directives `@cacheControl` để quản lý một số thiết lập caching

### Authentication
Ta có thể tận dụng thuộc tính context để kiểm tra authentication:  
```javascript
const server = new ApolloServer({ 
    typeDefs,
    resolvers,
    context: ({ req }) => {
        // Để demo được đơn giản ở đây chúng ta chỉ fake authenticate
        // miễn token tồn tại thì xem như pass authentication
        const token = req.headers.authorization || '';

        //Ở đây ta có thể throw error để chặn toàn bộ operation nếu chưa authenticate
        // if (!token) {
        //     throw new AuthenticationError('you must be logged in');
        // }
        return { token };
    },
});
```
Chặn trên resolver:

```javascript
addClass: (parent, args) => {
    if (!args.name) {
        throw new UserInputError("Name is required", {
            error: "Some thing that u like to put in"
        })
    }
    classes.push({
        id: classes.length + 1,
        name: args.name,
        formTeacherId: args.formTeacher,
        students: []
    });
    return classes[classes.length - 1];
}
```
> Nếu ta cài đặt graphQL server trên một server truyền thống, ta cũng có thể chặn authentication bên ngoài server này

