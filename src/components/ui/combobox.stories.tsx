import preview from '#.storybook/preview';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxSeparator,
} from './combobox';

const meta = preview.meta({
  title: 'UI/Combobox',
  component: Combobox,
  tags: ['autodocs'],
});

const fruits = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'grape', label: 'Grape' },
  { value: 'orange', label: 'Orange' },
  { value: 'strawberry', label: 'Strawberry' },
];

export const Default = meta.story({
  render: () => (
    <Combobox>
      <ComboboxInput placeholder="Select a fruit..." />
      <ComboboxContent>
        <ComboboxList>
          <ComboboxEmpty>No results found</ComboboxEmpty>
          {fruits.map((fruit) => (
            <ComboboxItem key={fruit.value} value={fruit.value}>
              {fruit.label}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
});

export const WithClearButton = meta.story({
  render: () => (
    <Combobox>
      <ComboboxInput placeholder="Select a fruit..." showClear />
      <ComboboxContent>
        <ComboboxList>
          <ComboboxEmpty>No results found</ComboboxEmpty>
          {fruits.map((fruit) => (
            <ComboboxItem key={fruit.value} value={fruit.value}>
              {fruit.label}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
});

export const WithGroups = meta.story({
  render: () => (
    <Combobox>
      <ComboboxInput placeholder="Select a food..." />
      <ComboboxContent>
        <ComboboxList>
          <ComboboxEmpty>No results found</ComboboxEmpty>
          <ComboboxGroup>
            <ComboboxLabel>Fruits</ComboboxLabel>
            <ComboboxItem value="apple">Apple</ComboboxItem>
            <ComboboxItem value="banana">Banana</ComboboxItem>
            <ComboboxItem value="orange">Orange</ComboboxItem>
          </ComboboxGroup>
          <ComboboxSeparator />
          <ComboboxGroup>
            <ComboboxLabel>Vegetables</ComboboxLabel>
            <ComboboxItem value="carrot">Carrot</ComboboxItem>
            <ComboboxItem value="broccoli">Broccoli</ComboboxItem>
            <ComboboxItem value="spinach">Spinach</ComboboxItem>
          </ComboboxGroup>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
});

export const Disabled = meta.story({
  render: () => (
    <Combobox>
      <ComboboxInput placeholder="Disabled combobox" disabled />
      <ComboboxContent>
        <ComboboxList>
          {fruits.map((fruit) => (
            <ComboboxItem key={fruit.value} value={fruit.value}>
              {fruit.label}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
});
