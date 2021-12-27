const { ApolloServer, gql, UserInputError, AuthenticationError } = require('apollo-server');
const students = require("./student-dummy.json");
const teachers = require("./teacher-dummy.json");
const classes = require("./class-dummy.json");
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

    input SearchStudent {
        name: String
        limit: Int!
        offset: Int!
    }
    
    input AddClass {
        name: String
        formTeacherID: Int
    }
    
    type Query {
        students: [Student]
        teachers: [Teacher]
        classes: [Class]
        someStudents(input: SearchStudent): [Student]
    }
    
    type Mutation {
        addClass(name: String, formTeacher: Int): Class
    }
`;

const resolvers = {
    Student: {
        class:  ({ classId }, args, context) => {
            console.log("argument", context);
            const cl = classes.find(ele => ele.id === classId);
            if (!cl) {
                return null;
            }
            return cl; 
        }
    },
    Class: {
        formTeacher: ({ formTeacherId }) => {
            let teacher = teachers.find(ele => ele.id === formTeacherId);
            if (!teacher) {
                return null;
            }
            teacher.password = null;
            return teacher;
        },
        students: ( parent) => {
            let students = students.filter(student => parent.students.includes(student.id));
            students = students.map(student => {
                return {
                    ...student,
                    password: null
                }
            })
            return students;
        }
    },
    Query: {
        students: () => {
            return students.map(student => {
                return {
                    ...student,
                    password: null
                }
            })
        },
        someStudents: (_, args, context) => {
            if (!context.token) {
                throw new AuthenticationError("UNAUTHORIZED");
            }
            let {name, offset, limit} = args.input;
            let data = students;
            if (name) {
                data = students.filter(s => s.name.toUpperCase().includes(name.toUpperCase()));
            }
            return data.slice(offset, offset + limit);
        },
        teachers: () => teachers.map(teacher => {
            return {
                ...teacher,
                password: null
            }
        }),
        classes: () => classes,
    },
    Mutation: {
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
    }
};

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
server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
});