# Invasive Plants

This Invasive Plants identification prototype provides users with the capability to identify invasive plants based on their region and suggests alternative non-invasive plants to plant instead. The Invasive Plants Admin Page enables authorized users to expand and modify the database for comprehensive coverage. For more information, please visit the [CIC Website](https://cic.ubc.ca/).

| Index                                               | Description                                             |
| :-------------------------------------------------- | :------------------------------------------------------ |
| [High Level Architecture](#high-level-architecture) | High level overview illustrating component interactions |
| [Deployment](#deployment-guide)                     | How to deploy the project                               |
| [User Guide](#user-guide)                           | The working solution                                    |
| [Directories](#directories)                             | General project directory structure
| [Changelog](#changelog)                             | Any changes post publish                                |
| [Credits](#credits)                                 | Meet the team behind the solution                       |
| [License](#license)                                 | License details                                         |

## High Level Architecture

The following architecture diagram illustrates the various AWS components utilized to deliver the solution. For an in-depth explanation of the frontend and backend stacks, refer to the [Architecture Deep Dive](docs/ArchitectureDeepDive.md).

![Alt text](docs/images/networkDiagram/architecture_diagram.svg)

## Deployment Guide

To deploy this solution, please follow the steps laid out in the [Deployment Guide](docs/DeploymentGuide.md)

## User Guide

For instructions on how to navigate the web app interface, refer to the [Web App User Guide](docs/UserGuide.md).

## Directories

```
├── backend
│   └── cdk
│       ├── bin
│       ├── lambda
│       └── lib
├── docs
│   └── images
└── frontend
    ├── public
    └── src
        ├── actions
        ├── components
        ├── functions
        ├── reducers
        └── views
```

1. `/backend/cdk`: Contains the deployment code for the app's AWS infrastructure
    - `/bin`: Contains the instantiation of CDK stack
    - `/lib`: Contains the deployment code for all infrastructure stacks
    - `/lambda`: Contains lambda functions
2. `/docs`: Contains documentation for the application
    - `/images`: Contains images used in documentation
3. `/frontend`: Contains the user interface of the application
    - `/src/actions`: Contains login actions
    - `/src/components`: Contains components used in the application
    - `/src/functions`: Contains helper functions used in the application
    - `/src/reducers`: Contains reducers facilitating the application's functionality
    - `/src/views`: Contains pages comprising the application's interface

## Changelog
N/A

## Credits

This application was architected and developed by Visal Saosuo, Julia You, and Yuheng Zhang, with project assistance from Franklin Ma. A special thanks to the UBC Cloud Innovation Centre Technical and Project Management teams for their guidance and support.

## License

This project is distributed under the [MIT License](LICENSE).

Licenses of libraries and tools used by the system are listed below:

[MIT License](LICENSE)

Used by Material UI library to design user interface
