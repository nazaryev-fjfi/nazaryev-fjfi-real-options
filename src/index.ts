import ch2Example from "./example/ch2";
import switchExample from "./example/switch";
import timingExample from './example/timing';

const example = process.argv[2]

if (example === 'ch2') {
    ch2Example();
}

if (example === 'timing') {
    timingExample();
}

if (example === 'switch') {
    switchExample()
}

