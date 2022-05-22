import { State, styled } from 'estrela';

function App() {
  let count = 0;

  count$;
}

const App2 = () => {
  let count = 0;

  count$;
};

const App3 = ({ count }: { count: number }) => {
  count$;
};

const App4 = (props: { count: number }) => {
  props.count$;
};

export default styled(App)`
  .title {
    font-size: 48px;
  }

  div {
    background-color: #eee;
  }
`;
