# maya-db
Encrypted, thread-safe local database for Electron apps
* **Process-less** - This is just a library, it doesn't spin up a separate "database process" that needs management. No crazy dependency-injection needed to make the database accessible to functions - initialise as many times as you want.
* **In-built encryption** - Uses 256-bit AES encryption for all data, unless you tell it not to.
* **Extensible to other platforms** - Can be extended to web (storing data in `localStorage`), cloud (storing data in S3), etc. All you need to do is write a single adapter class.
* **In-built concurrency control** - Uses semaphore based locking to enforce concurrency control even between multiple processes.

# Quick start

Currently, the database only supports desktop environments. It can be extended to other platforms via custom adapters (see below in docs).

**Quick Example:** setting data and querying it

```jsx
    const { localDb } = require('@mayahq/maya-db')

    // The database will be stored inside dbroot
    const dbroot = path.resolve(process.env.HOME, '.maya/localdb')

    // Initialising the database
    const db = localDb({
        encryptionKey: '[64-bit encryption key]',
        root: dbroot
    })

    const personalInfo = {
    	name: 'Dushyant',
      education: {
          college: 'BITS Pilani',
          graduation: 2022,
          degree: {
              type: 'single',
              branch: 'CS'
          }
      },
      address: 'Etihad Stadium, UAE'
    }

    // Creating a new block (file) and storing personalInfo in it
    db.createNewBlock('dushyant')
    db.block('dushyant').lockAndSet(personalInfo)

    // Querying the information stored in a GraphQL-like fashion
    const query = {
       name: null,
       lastName: 'Jain',
       education: {
           college: null,
           degreeType: 'single'
       }
    }
    db.block('dushyant').lockAndGet(query)
    	.then((result) => {
    		console.log(result)
    	})

    // Result is {
    //     name: 'Dushyant',
    //     lastName: 'Jain',
    //     education: {
    //         college: 'BITS Pilani',
    //         degreeType: 'single'
    //     }
    // }
```

# Overview

There are two main entities for modelling storage - `Block` and `Collection`. A `Block` is like a document in MongoDB, while a `Collection` is just a collection of `Block`s. Both blocks and collections are identified by unique filesystem-like "paths".

Though collections have no purpose other than to organise blocks, blocks do have a few features of note - 

- A block can either be completely encrypted or completely unencrypted, independently. It is not possible to change the encryption status of a block (i.e., encrypt and unencrypted block) after it is created.
- Reading and writing from blocks is "thread-safe", even if multiple processes are trying to write to the same block.

Although blocks and collections are stored as files and directories in desktop environments, accessing them directly will break things. Always access them via the `maya-db` library.

# API

Visit [this page](https://dotmaya.notion.site/maya-db-documentation-e41c986426644cc0b36e89858f991387) for full documentation
