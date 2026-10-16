import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CodeBlock } from './code-block';
import { vi } from 'vitest';

describe('CodeBlock', () => {
  let component: CodeBlock;
  let fixture: ComponentFixture<CodeBlock>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeBlock],
    }).compileComponents();

    fixture = TestBed.createComponent(CodeBlock);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should highlight TypeScript code', () => {
    fixture.componentRef.setInput('code', 'const message = "Hello";');
    fixture.componentRef.setInput('language', 'typescript');
    fixture.detectChanges();

    const highlighted = component.highlightedCode;
    const code = fixture.nativeElement.querySelector('code');
    expect(highlighted).toBeTruthy();
    expect(code.querySelector('.code-keyword')?.textContent).toBe('const');
    expect(code.querySelector('.code-string')?.textContent).toBe('"Hello"');
  });

  it('should copy code to clipboard', async () => {
    const clipboardSpy = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText: clipboardSpy } });
    fixture.componentRef.setInput('code', 'test code');

    await component.copyCode();

    expect(clipboardSpy).toHaveBeenCalledWith('test code');
    expect(component.copied()).toBe(true);
  });

  afterEach(() => vi.unstubAllGlobals());
});
