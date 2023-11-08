// import React, { Component } from 'react';
// import Typography from '@material-ui/core/Typography';
// import Button from '@mui/material/Button';

// class Error404 extends Component {
//     /** Page Render Info **/
//     page = {
//         title: "404",
//         description: "Hmm, there is no page you are looking for.",
//         btn: "Go to dashboard",
//     }
//     state = {}
//     render() {
//         const style = {
//             box: {
//                 display: 'flex',
//                 height: '50vh',
//                 padding: '3vh',
//                 flexDirection: 'column',
//                 alignItems: 'center',
//                 justifyContent: 'center',

//             },
//             btn: {
//                 marginTop: '2vh',
//                 marginBottom: '2vh',
//                 borderRadius: 10,
//                 padding: '1vh 6vh 1vh 6vh',
//             }
//         }
//         return (
//             <div style={style.box}>
//                 <Typography variant={"h1"} color="secondary"><span style={{ fontWeight: 'bold' }}>{this.page.title}</span></Typography>
//                 <Typography variant={"h6"}><span style={{ fontWeight: 'normal' }}>{this.page.description}</span></Typography>
//                 <Button style={style.btn} href="/dashboard" variant="outlined">{this.page.btn}</Button>
//             </div>
//         );
//     }
// }

// export default Error404;

import React, { Component } from 'react';
import Typography from '@material-ui/core/Typography';
import Button from '@mui/material/Button';

class Error404 extends Component {
    /** Page Render Info **/
    page = {
        title: "404",
        description: "Hmm, there is no page you are looking for.",
        btn: "Go to dashboard",
    };
    state = {};
    render() {
        const style = {
            box: {
                display: 'flex',
                height: '50vh',
                padding: '3vh',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
            },
            btn: {
                marginTop: '2vh',
                marginBottom: '2vh',
                borderRadius: 10,
                padding: '1vh 6vh 1vh 6vh',
            },
        };
        return React.createElement(
            'div',
            { style: style.box },
            React.createElement(
                Typography,
                { variant: "h1", color: "secondary" },
                React.createElement('span', { style: { fontWeight: 'bold' } }, this.page.title)
            ),
            React.createElement(
                Typography,
                { variant: "h6" },
                React.createElement('span', { style: { fontWeight: 'normal' } }, this.page.description)
            ),
            React.createElement(
                Button,
                { style: style.btn, href: "/dashboard", variant: "outlined" },
                this.page.btn
            )
        );
    }
}

export default Error404;
